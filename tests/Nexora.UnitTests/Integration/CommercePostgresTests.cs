using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Addresses.Commands.CreateAddress;
using Nexora.Application.Features.Cart.Commands.AddItemToCart;
using Nexora.Application.Features.Dashboard.Queries.GetInventorySummary;
using Nexora.Application.Features.Orders.Commands.CreateOrder;
using Nexora.Application.Features.Orders.Commands.UpdateOrderStatus;
using Nexora.Application.Features.Orders.Dtos;
using Nexora.Application.Features.Products.Commands.UpdateProduct;
using Nexora.Application.Features.Products.Queries.GetProductById;
using Nexora.Application.Features.Products.Queries.GetProducts;
using Nexora.Domain.Entities;
using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;
using Nexora.UnitTests.Features.Orders;
using Npgsql;

namespace Nexora.UnitTests.Integration;

[Trait("Category", "Integration")]
public sealed class CommercePostgresTests
{
    [PostgresFact]
    public async Task CatalogDeletionAndActivation_CannotBothCommit()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        foreach (var deleteBrand in new[] { true, false })
        {
            await using var seed = database.CreateContext();
            var data = await CommerceRegressionTests.SeedCartAsync(seed);
            data.Product.Brand.Name = "Brand " + Guid.NewGuid();
            data.Product.Category.Name = "Category " + Guid.NewGuid();
            data.Product.IsActive = false; await seed.SaveChangesAsync();
            async Task<bool> Activate()
            {
                await using var db = database.CreateContext();
                try
                {
                    await new Nexora.Application.Features.Products.Commands.UpdateProductStatus.UpdateProductStatusCommandHandler(db)
                        .Handle(new(data.Product.Id, true), default);
                    return true;
                }
                catch (NotFoundException) { return false; }
            }
            async Task<bool> Delete()
            {
                await using var db = database.CreateContext();
                try
                {
                    if (deleteBrand)
                        await new Nexora.Application.Features.Brands.Commands.DeleteBrand.DeleteBrandCommandHandler(db).Handle(new(data.Product.BrandId), default);
                    else
                        await new Nexora.Application.Features.Categories.Commands.DeleteCategory.DeleteCategoryCommandHandler(db).Handle(new(data.Product.CategoryId), default);
                    return true;
                }
                catch (ConflictException) { return false; }
            }
            var outcomes = await Task.WhenAll(Delete(), Activate());
            outcomes.Count(success => success).Should().Be(1);
            await using var check = database.CreateContext();
            (await check.Products.AnyAsync(p => p.Id == data.Product.Id && p.IsActive && (p.Brand.IsDeleted || p.Category.IsDeleted)))
                .Should().BeFalse();
        }
    }

    [PostgresFact]
    public async Task ConcurrentSameKeyCheckouts_ReturnSameOrder_AndUniqueIndexRejectsDuplicates()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        await using var seed = database.CreateContext();
        var data = await CommerceRegressionTests.SeedCartAsync(seed, 10);
        var payment = new Mock<IPaymentService>();
        var command = CommerceRegressionTests.OrderCommand(data.User.Id, expected: 129.90m) with { IdempotencyKey = "parallel-key" };
        async Task<OrderDto> Checkout()
        {
            await using var context = database.CreateContext();
            return (await CommerceRegressionTests.CreateHandler(context, payment).Handle(command, default)).Data!;
        }
        var results = await Task.WhenAll(Checkout(), Checkout());
        results[0].Should().BeEquivalentTo(results[1]);
        payment.Verify(p => p.ProcessPaymentAsync(It.IsAny<decimal>(), It.IsAny<PaymentRequestDto>(), It.IsAny<CancellationToken>()), Times.Once);
        await using var check = database.CreateContext();
        (await check.Orders.CountAsync()).Should().Be(1);
        (await check.Products.SingleAsync()).StockQuantity.Should().Be(9);
        check.Orders.Add(new Order { UserId = data.User.Id, OrderNumber = "duplicate", ShippingAddress = "Test address",
            IdempotencyKey = command.IdempotencyKey, RequestHash = "hash" });
        var error = await Assert.ThrowsAsync<DbUpdateException>(() => check.SaveChangesAsync());
        ((PostgresException)error.InnerException!).SqlState.Should().Be(PostgresErrorCodes.UniqueViolation);
    }

    [PostgresFact]
    public async Task ConcurrentCartAdds_OneRowWithCombinedQuantity()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        await using var seed = database.CreateContext();
        var data = await CommerceRegressionTests.SeedCartAsync(seed, 50);
        var actions = Enumerable.Range(0, 8).Select(async _ =>
        {
            await using var context = database.CreateContext();
            return await new AddItemToCartCommandHandler(context).Handle(new AddItemToCartCommand(data.User.Id, data.Product.Id, null, 1), default);
        });
        await Task.WhenAll(actions);
        await using var check = database.CreateContext();
        var items = await check.CartItems.Where(i => i.CartId == data.Cart.Id).ToListAsync();
        items.Should().ContainSingle(); items.Single().Quantity.Should().Be(9);
    }

    [PostgresFact]
    public async Task ConcurrentCheckouts_LastStockCannotOversell()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        await using var seed = database.CreateContext();
        var data = await CommerceRegressionTests.SeedCartAsync(seed, 3);
        data.Cart.Items.Single().Quantity = 2;
        var otherUser = new User { FirstName = "Diğer", LastName = "Kullanıcı", Email = "other@example.test", PasswordHash = "test", IsActive = true };
        seed.Carts.Add(new Cart { User = otherUser, Items = [new CartItem { ProductId = data.Product.Id, Quantity = 2 }] });
        await seed.SaveChangesAsync();
        var release = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var entered = 0;
        async Task<bool> Checkout(Guid userId)
        {
            await using var context = database.CreateContext();
            var payment = new Mock<IPaymentService>();
            var handler = CommerceRegressionTests.CreateHandler(context, payment);
            payment.Setup(x => x.ProcessPaymentAsync(It.IsAny<decimal>(), It.IsAny<PaymentRequestDto>(), It.IsAny<CancellationToken>()))
                .Returns(async () => { if (Interlocked.Increment(ref entered) == 2) release.SetResult(); await release.Task.WaitAsync(TimeSpan.FromSeconds(20)); return true; });
            try { return (await handler.Handle(CommerceRegressionTests.OrderCommand(userId, expected: 229.90m), default)).IsSuccess; }
            catch (ConflictException) { return false; }
        }
        var results = await Task.WhenAll(Checkout(data.User.Id), Checkout(otherUser.Id));
        results.Count(x => x).Should().Be(1);
        await using var check = database.CreateContext();
        (await check.Products.SingleAsync()).StockQuantity.Should().Be(1);
        (await check.Orders.CountAsync()).Should().Be(1);
    }

    [PostgresFact]
    public async Task Xmin_StaleBrowserEditCannotRestoreSoldStock()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        await using var seed = database.CreateContext(); var data = await CommerceRegressionTests.SeedCartAsync(seed, 10);
        await using var browser = database.CreateContext();
        var original = (await new GetProductByIdQueryHandler(browser).Handle(new GetProductByIdQuery(data.Product.Id), default)).Data!;
        original.Version.Should().NotBe(0);
        await using (var sale = database.CreateContext())
        {
            var product = await sale.Products.SingleAsync(); product.StockQuantity = 9; await sale.SaveChangesAsync();
        }
        var command = new UpdateProductCommand(original.Id, original.Name, original.SKU, original.Description, original.Price, original.StockQuantity,
            original.CategoryId, original.BrandId, original.IsActive, Version: original.Version);
        await Assert.ThrowsAsync<ConflictException>(() => new UpdateProductCommandHandler(browser).Handle(command, default));
        await using var check = database.CreateContext(); (await check.Products.SingleAsync()).StockQuantity.Should().Be(9);
    }

    [PostgresFact]
    public async Task CancelAndShip_OnlyOneTransitionCanCommit()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        await using var seed = database.CreateContext(); var data = await CommerceRegressionTests.SeedCartAsync(seed);
        var order = new Order { UserId = data.User.Id, OrderNumber = "NX-RACE", ShippingAddress = "Adres", Status = OrderStatus.Processing,
            PaymentStatus = PaymentStatus.Success, StockReserved = true, TotalAmount = 500, Items = [new OrderItem { ProductId = data.Product.Id, ProductName = "Ürün", UnitPrice = 100, Quantity = 5, TotalPrice = 500 }] };
        seed.Orders.Add(order); await seed.SaveChangesAsync();
        async Task<bool> Change(OrderStatus status)
        {
            await using var context = database.CreateContext();
            var handler = new UpdateOrderStatusCommandHandler(context, Mock.Of<IRealTimeNotificationService>(), Mock.Of<IEmailService>(), NullLogger<UpdateOrderStatusCommandHandler>.Instance);
            try { return (await handler.Handle(new UpdateOrderStatusCommand(order.Id, status), default)).IsSuccess; }
            catch (ConflictException) { return false; }
        }
        var results = await Task.WhenAll(Change(OrderStatus.Cancelled), Change(OrderStatus.Shipped));
        results.Count(x => x).Should().Be(1);
        await using var check = database.CreateContext();
        var status = (await check.Orders.SingleAsync()).Status;
        (await check.Products.SingleAsync()).StockQuantity.Should().Be(status == OrderStatus.Cancelled ? 10 : 5);
    }

    [PostgresFact]
    public async Task ConcurrentDefaultAddresses_ExactlyOneDefaultRemains()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        await using var seed = database.CreateContext(); var data = await CommerceRegressionTests.SeedCartAsync(seed);
        async Task Create(string title)
        {
            await using var context = database.CreateContext();
            await new CreateAddressCommandHandler(context).Handle(new CreateAddressCommand(data.User.Id, title, "Test Kullanıcı", "05551234567", "İstanbul", "Kadıköy", "Test sokak 1", IsDefault: true), default);
        }
        await Task.WhenAll(Create("Ev"), Create("İş"));
        await using var check = database.CreateContext();
        (await check.UserAddresses.CountAsync()).Should().Be(2);
        (await check.UserAddresses.CountAsync(a => a.IsDefault && !a.IsDeleted)).Should().Be(1);
    }

    [PostgresFact]
    public async Task DatabaseConstraints_BlockDuplicateCartAndReviewRows()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        await using var seed = database.CreateContext(); var data = await CommerceRegressionTests.SeedCartAsync(seed);
        await using (var duplicate = database.CreateContext())
        {
            duplicate.CartItems.Add(new CartItem { CartId = data.Cart.Id, ProductId = data.Product.Id, Quantity = 1 });
            var error = await Assert.ThrowsAsync<DbUpdateException>(() => duplicate.SaveChangesAsync());
            ((PostgresException)error.InnerException!).SqlState.Should().Be("23505");
        }
        seed.Reviews.Add(new Review { ProductId = data.Product.Id, UserId = data.User.Id, Rating = 5 }); await seed.SaveChangesAsync();
        await using var secondReview = database.CreateContext();
        secondReview.Reviews.Add(new Review { ProductId = data.Product.Id, UserId = data.User.Id, Rating = 4 });
        var reviewError = await Assert.ThrowsAsync<DbUpdateException>(() => secondReview.SaveChangesAsync());
        ((PostgresException)reviewError.InnerException!).SqlState.Should().Be("23505");
    }

    [PostgresFact]
    public async Task CatalogAndInventoryQueries_TranslateAndUseFullDatabase()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        await using var context = database.CreateContext(); var data = await CommerceRegressionTests.SeedCartAsync(context, 8);
        context.ProductVariants.Add(new ProductVariant { ProductId = data.Product.Id, SKU = "VARIANT", Price = 50, StockQuantity = 2 });
        context.Reviews.Add(new Review { ProductId = data.Product.Id, UserId = data.User.Id, Rating = 4 }); await context.SaveChangesAsync();
        var products = await new GetProductsQueryHandler(context).Handle(new GetProductsQuery(SearchTerm: "ürün", MinPrice: 90, MaxPrice: 110, SortBy: "price-desc"), default);
        products.Data!.TotalCount.Should().Be(1); products.Data.Items.Single().AverageRating.Should().Be(4);
        var inventory = (await new GetInventorySummaryQueryHandler(context).Handle(new GetInventorySummaryQuery(), default)).Data!;
        inventory.TotalInventoryValue.Should().Be(900); inventory.LowStockCount.Should().Be(1);
    }
}
