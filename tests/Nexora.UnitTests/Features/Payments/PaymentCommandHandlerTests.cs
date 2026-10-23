using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Payments.Commands.CompletePayment;
using Nexora.Application.Features.Payments.Commands.InitializePayment;
using Nexora.Application.Features.Payments.Dtos;
using Nexora.Application.Features.Payments.Queries.GetPaymentStatus;
using Nexora.Domain.Entities;
using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;
using Nexora.Infrastructure.BackgroundJobs;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;
using Nexora.UnitTests.Features.Orders;
using ShoppingCart = Nexora.Domain.Entities.Cart;

namespace Nexora.UnitTests.Features.Payments;

public sealed class PaymentCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext db = TestDbContextFactory.Create();
    private readonly Mock<IPaymentGateway> gateway = CreateGateway();
    private readonly Mock<IEmailService> email = new();

    public static Mock<IPaymentGateway> CreateGateway()
    {
        var gateway = new Mock<IPaymentGateway>();
        gateway.Setup(g => g.InitializePaymentAsync(It.IsAny<PaymentInitializationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new(true, Guid.NewGuid().ToString(), null, "https://sandbox-cpp.iyzipay.com/checkout", null));
        return gateway;
    }

    private async Task<(Order Order, Product Product, ShoppingCart Cart)> Initialize(string? coupon = null)
    {
        var data = await CommerceRegressionTests.SeedCartAsync(db);
        var result = await new InitializePaymentCommandHandler(db, gateway.Object).Handle(
            new("Adres", CouponCode: coupon, IdempotencyKey: Guid.NewGuid().ToString()) { UserId = data.User.Id }, default);
        result.IsSuccess.Should().BeTrue();
        return (db.Orders.Single(o => o.PaymentToken == result.Data!.Token), data.Product, data.Cart);
    }

    private Task<Nexora.Application.Common.Result<PaymentVerificationResult>> Complete(Order order,
        decimal? amount = null, int? fraud = 1, bool success = true, bool definitive = false, string? basket = null)
    {
        gateway.Setup(g => g.VerifyPaymentAsync(It.IsAny<PaymentVerificationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PaymentVerificationResult(success, "pay-" + order.Id, basket ?? order.OrderNumber, amount ?? order.TotalAmount,
                success ? null : "Geçici hata", definitive, fraud, "TRY"));
        return new CompletePaymentCommandHandler(db, gateway.Object, email.Object).Handle(new(order.PaymentToken!), default);
    }

    [Fact]
    public async Task Initialize_ReservesStockAndCoupon_WithoutConsumingUsage()
    {
        var coupon = new Coupon { Code = "ONCE", DiscountType = DiscountType.Percentage, DiscountValue = 10,
            TotalUsageLimit = 1, ExpirationDateUtc = DateTime.UtcNow.AddDays(1) };
        db.Coupons.Add(coupon); await db.SaveChangesAsync();
        var (order, product, cart) = await Initialize(coupon.Code);
        product.StockQuantity.Should().Be(4);
        order.StockReserved.Should().BeTrue();
        order.PaymentStatus.Should().Be(PaymentStatus.Pending);
        order.Items.Single().SourceCartItemId.Should().Be(cart.Items.Single().Id);
        coupon.ReservedUsageCount.Should().Be(1);
        coupon.CurrentUsageCount.Should().Be(0);
        var nextUser = await CommerceRegressionTests.SeedCartAsync(db);
        var act = () => new InitializePaymentCommandHandler(db, gateway.Object).Handle(
            new("Adres", CouponCode: coupon.Code) { UserId = nextUser.User.Id }, default);
        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task Initialize_SameKey_ReturnsExistingSessionWithoutReservingAgain()
    {
        var data = await CommerceRegressionTests.SeedCartAsync(db);
        var command = new InitializePaymentCommand("Adres", IdempotencyKey: "same") { UserId = data.User.Id };
        var handler = new InitializePaymentCommandHandler(db, gateway.Object);
        var first = await handler.Handle(command, default);
        var second = await handler.Handle(command, default);
        second.Data.Should().BeEquivalentTo(first.Data);
        data.Product.StockQuantity.Should().Be(4);
        db.Orders.Count().Should().Be(1);
        gateway.Verify(g => g.InitializePaymentAsync(It.IsAny<PaymentInitializationRequest>(), It.IsAny<CancellationToken>()), Times.Once);
        var changed = () => handler.Handle(command with { ShippingAddress = "Different" }, default);
        await changed.Should().ThrowAsync<ConflictException>();
    }

    [Theory]
    [InlineData(false, false)]
    [InlineData(true, true)]
    public async Task Initialize_RejectsUnavailableProducts(bool active, bool deleted)
    {
        var data = await CommerceRegressionTests.SeedCartAsync(db);
        data.Product.IsActive = active; data.Product.IsDeleted = deleted; await db.SaveChangesAsync();
        var act = () => new InitializePaymentCommandHandler(db, gateway.Object).Handle(new("Adres") { UserId = data.User.Id }, default);
        await act.Should().ThrowAsync<ConflictException>();
        gateway.Verify(g => g.InitializePaymentAsync(It.IsAny<PaymentInitializationRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Initialize_RejectsUnavailableVariant()
    {
        var data = await CommerceRegressionTests.SeedCartAsync(db);
        var variant = new ProductVariant { Product = data.Product, SKU = "variant", Price = 100, StockQuantity = 10, IsActive = false };
        db.ProductVariants.Add(variant); await db.SaveChangesAsync();
        data.Cart.Items.Single().ProductVariantId = variant.Id; await db.SaveChangesAsync();
        var act = () => new InitializePaymentCommandHandler(db, gateway.Object).Handle(new("Adres") { UserId = data.User.Id }, default);
        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task Initialize_EmptyCart_RejectsBeforeGateway()
    {
        var data = await CommerceRegressionTests.SeedCartAsync(db);
        db.CartItems.RemoveRange(data.Cart.Items); await db.SaveChangesAsync();
        var act = () => new InitializePaymentCommandHandler(db, gateway.Object).Handle(new("Adres") { UserId = data.User.Id }, default);
        await act.Should().ThrowAsync<BusinessValidationException>();
    }

    [Theory]
    [InlineData(OrderStatus.Paid)]
    [InlineData(OrderStatus.Processing)]
    [InlineData(OrderStatus.Shipped)]
    [InlineData(OrderStatus.Delivered)]
    public async Task Complete_ReplayIsIndependentOfFulfilmentStatus(OrderStatus status)
    {
        var (order, product, _) = await Initialize();
        (await Complete(order)).IsSuccess.Should().BeTrue();
        order.Status = status; await db.SaveChangesAsync();
        (await Complete(order, success: false)).IsSuccess.Should().BeTrue();
        product.StockQuantity.Should().Be(4);
        order.Status.Should().Be(status);
        db.Notifications.Count(n => n.Type == NotificationType.OrderCreated).Should().Be(1);
        gateway.Verify(g => g.VerifyPaymentAsync(It.IsAny<PaymentVerificationRequest>(), It.IsAny<CancellationToken>()), Times.Once);
        email.Verify(e => e.SendOrderConfirmationEmailAsync(It.IsAny<Nexora.Application.Features.Orders.Dtos.OrderDto>(),
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Complete_TransientFailureRetainsReservation_ThenCanRecover()
    {
        var (order, product, _) = await Initialize();
        (await Complete(order, success: false)).IsSuccess.Should().BeFalse();
        order.Status.Should().Be(OrderStatus.Pending);
        order.PaymentStatus.Should().Be(PaymentStatus.Unknown);
        order.NextPaymentCheckAtUtc.Should().NotBeNull();
        product.StockQuantity.Should().Be(4);
        (await Complete(order)).IsSuccess.Should().BeTrue();
        product.StockQuantity.Should().Be(4);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(null)]
    public async Task Complete_FraudReviewCannotBeFulfilled(int? fraud)
    {
        var (order, product, _) = await Initialize();
        (await Complete(order, fraud: fraud)).IsSuccess.Should().BeFalse();
        order.Status.Should().Be(OrderStatus.Pending);
        product.StockQuantity.Should().Be(4);
        Action advance = () => order.ChangeStatus(OrderStatus.Paid);
        advance.Should().Throw<ConflictException>();
        (await Complete(order)).IsSuccess.Should().BeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(1)]
    public async Task Complete_InvalidAmountRequiresAttentionWithoutDiscardingReservation(decimal amount)
    {
        var (order, product, _) = await Initialize();
        (await Complete(order, amount: amount)).IsSuccess.Should().BeFalse();
        order.PaymentStatus.Should().Be(PaymentStatus.RequiresAttention);
        order.Status.Should().Be(OrderStatus.Pending);
        product.StockQuantity.Should().Be(4);
    }

    [Fact]
    public async Task Complete_DefiniteFailureRestoresStockAndCouponExactlyOnce()
    {
        var coupon = new Coupon { Code = "ONCE", DiscountType = DiscountType.Percentage, DiscountValue = 10,
            TotalUsageLimit = 1, ExpirationDateUtc = DateTime.UtcNow.AddDays(1) };
        db.Coupons.Add(coupon); await db.SaveChangesAsync();
        var (order, product, _) = await Initialize(coupon.Code);
        await Complete(order, success: false, definitive: true);
        await Complete(order, success: false, definitive: true);
        order.Status.Should().Be(OrderStatus.Cancelled);
        order.PaymentStatus.Should().Be(PaymentStatus.Failed);
        product.StockQuantity.Should().Be(5);
        coupon.ReservedUsageCount.Should().Be(0);
        coupon.CurrentUsageCount.Should().Be(0);
    }

    [Fact]
    public async Task Complete_SuccessConsumesCouponReservation()
    {
        var coupon = new Coupon { Code = "ONCE", DiscountType = DiscountType.Percentage, DiscountValue = 10,
            TotalUsageLimit = 1, ExpirationDateUtc = DateTime.UtcNow.AddDays(1) };
        db.Coupons.Add(coupon); await db.SaveChangesAsync();
        var (order, _, _) = await Initialize(coupon.Code);
        await Complete(order);
        coupon.ReservedUsageCount.Should().Be(0);
        coupon.CurrentUsageCount.Should().Be(1);
    }

    [Fact]
    public async Task Complete_PreservesQuantityAddedDuringCheckout()
    {
        var (order, _, cart) = await Initialize();
        cart.Items.Single().Quantity += 3; await db.SaveChangesAsync();
        await Complete(order);
        cart.Items.Single().Quantity.Should().Be(3);
    }

    [Fact]
    public async Task Complete_DoesNotRemoveRecreatedCartRow()
    {
        var (order, product, cart) = await Initialize();
        db.CartItems.RemoveRange(cart.Items); await db.SaveChangesAsync();
        cart.Items.Add(new CartItem { CartId = cart.Id, ProductId = product.Id, Quantity = 2 });
        await db.SaveChangesAsync();
        await Complete(order);
        cart.Items.Single().Quantity.Should().Be(2);
    }

    [Fact]
    public async Task Complete_DoesNotReopenCancelledOrUnreservedLegacyOrder()
    {
        var (order, product, _) = await Initialize();
        order.Status = OrderStatus.Cancelled; order.StockReserved = false; await db.SaveChangesAsync();
        await Complete(order);
        order.Status.Should().Be(OrderStatus.Cancelled);
        order.PaymentStatus.Should().Be(PaymentStatus.RequiresAttention);
        product.StockQuantity.Should().Be(4);
    }

    [Fact]
    public async Task UnknownToken_DoesNotQueryGatewayOrFallBackToBasket()
    {
        var handler = new CompletePaymentCommandHandler(db, gateway.Object, email.Object);
        (await handler.Handle(new("unknown-token"), default)).IsSuccess.Should().BeFalse();
        gateway.Verify(g => g.VerifyPaymentAsync(It.IsAny<PaymentVerificationRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task BasketMismatchCannotCancelAnotherOrder()
    {
        var (order, product, _) = await Initialize();
        await Complete(order, success: false, definitive: true, basket: "different-order");
        order.Status.Should().Be(OrderStatus.Pending);
        product.StockQuantity.Should().Be(4);
    }

    [Fact]
    public async Task Cleanup_DoesNotReleaseUncertainOnlinePayment()
    {
        var (order, product, _) = await Initialize();
        order.CreatedAtUtc = DateTime.UtcNow.AddDays(-2); await db.SaveChangesAsync();
        var job = new OrderCleanupJob(db, NullLogger<OrderCleanupJob>.Instance, Mock.Of<IDbLogger>());
        await job.CancelStalePendingOrdersAsync();
        order.Status.Should().Be(OrderStatus.Pending);
        product.StockQuantity.Should().Be(4);
        Action cancel = () => order.CancelAndRestock();
        cancel.Should().Throw<ConflictException>();
    }

    [Fact]
    public void Cancel_UnreservedOrderDoesNotCreateStock()
    {
        var product = new Product { StockQuantity = 5 };
        var order = new Order { Items = [new OrderItem { Product = product, Quantity = 2 }] };
        order.CancelAndRestock(); order.CancelAndRestock();
        product.StockQuantity.Should().Be(5);
    }

    [Fact]
    public async Task Status_CannotReadAnotherUsersPayment()
    {
        var (order, _, _) = await Initialize();
        var handler = new GetPaymentStatusQueryHandler(db);
        var act = () => handler.Handle(new(Guid.NewGuid(), order.OrderNumber), default);
        await act.Should().ThrowAsync<NotFoundException>();
        (await handler.Handle(new(order.UserId, order.OrderNumber), default)).Data!.PaymentStatus.Should().Be("Pending");
    }

    public void Dispose() => TestDbContextFactory.Destroy(db);
}
