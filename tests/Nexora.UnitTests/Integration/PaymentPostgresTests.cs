using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Payments.Commands.CompletePayment;
using Nexora.Application.Features.Payments.Commands.InitializePayment;
using Nexora.Application.Features.Payments.Dtos;
using Nexora.Domain.Entities;
using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;
using Nexora.UnitTests.Features.Orders;
using Nexora.UnitTests.Features.Payments;

namespace Nexora.UnitTests.Integration;

[Trait("Category", "Integration")]
public sealed class PaymentPostgresTests
{
    [PostgresFact]
    public async Task MigrationPreservesLegacyPaymentTokensWithoutInventingReservations()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        await using var db = database.CreateContext();
        var migrator = db.GetService<IMigrator>();
        await migrator.MigrateAsync("20261023115007_PersistOrderIdempotency");
        await db.Database.ExecuteSqlRawAsync("""
            INSERT INTO "Users" ("Id", "FirstName", "LastName", "Email", "PasswordHash", "IsActive", "IsEmailConfirmed", "CreatedAtUtc", "SecurityStamp")
            VALUES ('11111111-1111-1111-1111-111111111111', 'Test', 'User', 'migration@example.test', 'hash', true, true, NOW(), gen_random_uuid());
            INSERT INTO "Orders" ("Id", "OrderNumber", "UserId", "ShippingAddress", "TotalAmount", "Status", "PaymentStatus", "CreatedAtUtc", "IdempotencyKey")
            VALUES (gen_random_uuid(), 'NX-PENDING', '11111111-1111-1111-1111-111111111111', 'Address', 100, 'Pending', 'Pending', NOW(), 'pending-token'),
                   (gen_random_uuid(), 'NX-PAID', '11111111-1111-1111-1111-111111111111', 'Address', 100, 'Paid', 'Success', NOW(), 'paid-token');
            """);
        await migrator.MigrateAsync();
        var pending = await db.Orders.SingleAsync(o => o.OrderNumber == "NX-PENDING");
        pending.PaymentToken.Should().Be("pending-token");
        pending.StockReserved.Should().BeFalse();
        pending.NextPaymentCheckAtUtc.Should().NotBeNull();
        var paid = await db.Orders.SingleAsync(o => o.OrderNumber == "NX-PAID");
        paid.PaymentToken.Should().Be("paid-token");
        paid.StockReserved.Should().BeTrue();
    }

    [PostgresFact]
    public async Task LastUnit_CanBeReservedByOnlyOneUser_BeforeGatewayUrlIsExposed()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        await using var seed = database.CreateContext();
        var first = await CommerceRegressionTests.SeedCartAsync(seed, 1);
        var other = new User { FirstName = "Other", LastName = "User", Email = "other@example.test", PasswordHash = "hash" };
        seed.Carts.Add(new Cart { User = other, Items = [new CartItem { ProductId = first.Product.Id, Quantity = 1 }] });
        await seed.SaveChangesAsync();
        var gateway = PaymentCommandHandlerTests.CreateGateway();
        async Task<bool> Start(Guid user)
        {
            await using var db = database.CreateContext();
            try { return (await new InitializePaymentCommandHandler(db, gateway.Object).Handle(new("Adres", IdempotencyKey: Guid.NewGuid().ToString()) { UserId = user }, default)).IsSuccess; }
            catch (ConflictException) { return false; }
        }
        var outcomes = await Task.WhenAll(Start(first.User.Id), Start(other.Id));
        outcomes.Count(x => x).Should().Be(1);
        await using var check = database.CreateContext();
        (await check.Products.SingleAsync(p => p.Id == first.Product.Id)).StockQuantity.Should().Be(0);
        (await check.Orders.CountAsync()).Should().Be(1);
        gateway.Verify(g => g.InitializePaymentAsync(It.IsAny<PaymentInitializationRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [PostgresFact]
    public async Task LastCouponUse_CanBeReservedByOnlyOneCheckout()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        await using var seed = database.CreateContext();
        var first = await CommerceRegressionTests.SeedCartAsync(seed);
        // Use distinct names because the catalog has unique names in PostgreSQL.
        first.Product.Category.Name = "First"; first.Product.Brand.Name = "First"; await seed.SaveChangesAsync();
        var second = await CommerceRegressionTests.SeedCartAsync(seed);
        var coupon = new Coupon { Code = "ONCE", DiscountType = DiscountType.Percentage, DiscountValue = 10,
            TotalUsageLimit = 1, ExpirationDateUtc = DateTime.UtcNow.AddDays(1) };
        seed.Coupons.Add(coupon); await seed.SaveChangesAsync();
        var gateway = PaymentCommandHandlerTests.CreateGateway();
        async Task<bool> Start(Guid user)
        {
            await using var db = database.CreateContext();
            try { return (await new InitializePaymentCommandHandler(db, gateway.Object).Handle(new("Adres", CouponCode: "ONCE") { UserId = user }, default)).IsSuccess; }
            catch (ConflictException) { return false; }
        }
        var outcomes = await Task.WhenAll(Start(first.User.Id), Start(second.User.Id));
        outcomes.Count(x => x).Should().Be(1);
        await using var check = database.CreateContext();
        (await check.Coupons.SingleAsync()).ReservedUsageCount.Should().Be(1);
        (await check.Orders.CountAsync()).Should().Be(1);
    }

    [PostgresFact]
    public async Task ParallelCallbacks_CommitOnce_AndReplayPreservesShippedStatus()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        await using var seed = database.CreateContext();
        var data = await CommerceRegressionTests.SeedCartAsync(seed);
        var gateway = PaymentCommandHandlerTests.CreateGateway();
        var initialized = await new InitializePaymentCommandHandler(seed, gateway.Object).Handle(new("Adres") { UserId = data.User.Id }, default);
        var order = await seed.Orders.SingleAsync();
        gateway.Setup(g => g.VerifyPaymentAsync(It.IsAny<PaymentVerificationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PaymentVerificationResult(true, "paid-id", order.OrderNumber, order.TotalAmount, null, FraudStatus: 1, Currency: "TRY"));
        async Task Complete()
        {
            await using var db = database.CreateContext();
            await new CompletePaymentCommandHandler(db, gateway.Object, Mock.Of<IEmailService>()).Handle(new(initialized.Data!.Token!), default);
        }
        await Task.WhenAll(Complete(), Complete());
        await using var check = database.CreateContext();
        (await check.Products.SingleAsync()).StockQuantity.Should().Be(4);
        (await check.Notifications.CountAsync(n => n.Type == NotificationType.OrderCreated)).Should().Be(1);
        (await check.CartItems.CountAsync()).Should().Be(0);
        var paid = await check.Orders.SingleAsync(); paid.Status = OrderStatus.Shipped; await check.SaveChangesAsync();
        await Complete(); await check.Entry(paid).ReloadAsync();
        paid.Status.Should().Be(OrderStatus.Shipped);
        gateway.Verify(g => g.VerifyPaymentAsync(It.IsAny<PaymentVerificationRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
