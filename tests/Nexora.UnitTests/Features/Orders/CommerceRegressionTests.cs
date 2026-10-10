using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Cart.Queries.GetCartQuote;
using Nexora.Application.Features.Coupons.Commands.CreateCoupon;
using Nexora.Application.Features.Orders.Commands.CreateOrder;
using Nexora.Application.Features.Orders.Commands.UpdateOrderStatus;
using Nexora.Application.Features.Orders.Dtos;
using Nexora.Application.Features.Products.Commands.UpdateProduct;
using Nexora.Application.Features.Products.Commands.UpdateProductStatus;
using Nexora.Domain.Entities;
using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;
using ShoppingCart = Nexora.Domain.Entities.Cart;

namespace Nexora.UnitTests.Features.Orders;

public sealed class CommerceRegressionTests
{
    [Fact]
    public async Task Quote_AfterProductPriceChanges_ReturnsCurrentPricesForBothLinesAndTotals()
    {
        await using var context = TestDbContextFactory.Create();
        var data = await SeedCartAsync(context);
        data.Cart.Items.Single().Quantity = 2;
        await context.SaveChangesAsync();
        var previousCart = (await new Nexora.Application.Features.Cart.Queries.GetUserCart.GetUserCartQueryHandler(context)
            .Handle(new(data.User.Id), default)).Data!;
        data.Product.Price = 200;
        await context.SaveChangesAsync();
        var quote = (await new GetCartQuoteQueryHandler(context).Handle(new(data.User.Id), default)).Data!;
        previousCart.Items.Single().UnitPrice.Should().Be(100);
        quote.Subtotal.Should().Be(400);
        quote.Items!.Should().ContainSingle();
        quote.Items.Single().UnitPrice.Should().Be(200);
        quote.Items.Single().TotalPrice.Should().Be(400);
        quote.TotalAmount.Should().Be(quote.Subtotal + quote.ShippingFee - quote.DiscountAmount);
    }

    public static async Task<(User User, Product Product, ShoppingCart Cart)> SeedCartAsync(NexoraDbContext context, int stock = 5)
    {
        var user = new User { FirstName = "Test", LastName = "Kullanıcı", Email = Guid.NewGuid() + "@example.test", PasswordHash = "test", IsActive = true, IsEmailConfirmed = true };
        var product = new Product { Name = "Ürün", SKU = Guid.NewGuid().ToString("N"), Price = 100, StockQuantity = stock, Version = 1,
            Category = new Category { Name = "Kategori" }, Brand = new Brand { Name = "Marka" } };
        var cart = new ShoppingCart { User = user, Items = [new CartItem { Product = product, Quantity = 1 }] };
        context.Carts.Add(cart);
        await context.SaveChangesAsync();
        return (user, product, cart);
    }

    public static CreateOrderCommandHandler CreateHandler(NexoraDbContext context, Mock<IPaymentService>? payment = null)
    {
        payment ??= new Mock<IPaymentService>();
        payment.Setup(x => x.ProcessPaymentAsync(It.IsAny<decimal>(), It.IsAny<PaymentRequestDto>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
        return new CreateOrderCommandHandler(context, payment.Object, Mock.Of<IEmailService>(), Mock.Of<IRealTimeNotificationService>(), NullLogger<CreateOrderCommandHandler>.Instance);
    }

    public static CreateOrderCommand OrderCommand(Guid userId, string? coupon = null, decimal? expected = null) =>
        new(userId, "Test teslimat adresi", new PaymentRequestDto("4111111111111111", "Test Kullanıcı", "12", "2030", "123"), coupon, expected);

    [Fact]
    public async Task Checkout_DuplicateRowsAggregateStockBeforePayment()
    {
        await using var context = TestDbContextFactory.Create();
        var data = await SeedCartAsync(context, 1);
        context.CartItems.Add(new CartItem { CartId = data.Cart.Id, ProductId = data.Product.Id, Quantity = 1 });
        await context.SaveChangesAsync();
        var payment = new Mock<IPaymentService>();
        var handler = CreateHandler(context, payment);
        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(OrderCommand(data.User.Id), default));
        payment.Verify(x => x.ProcessPaymentAsync(It.IsAny<decimal>(), It.IsAny<PaymentRequestDto>(), It.IsAny<CancellationToken>()), Times.Never);
        data.Product.StockQuantity.Should().Be(1);
        (await context.Orders.CountAsync()).Should().Be(0);
    }

    [Theory]
    [InlineData(false, false)]
    [InlineData(true, true)]
    public async Task Checkout_VariantOfInactiveOrDeletedParentRejected(bool active, bool deleted)
    {
        await using var context = TestDbContextFactory.Create();
        var data = await SeedCartAsync(context);
        data.Product.IsActive = active; data.Product.IsDeleted = deleted;
        var variant = new ProductVariant { Product = data.Product, SKU = "V", Price = 100, StockQuantity = 5 };
        context.ProductVariants.Add(variant);
        var item = data.Cart.Items.Single(); item.ProductVariant = variant; item.ProductVariantId = variant.Id;
        await context.SaveChangesAsync();
        await Assert.ThrowsAsync<ConflictException>(() => CreateHandler(context).Handle(OrderCommand(data.User.Id), default));
        variant.StockQuantity.Should().Be(5);
    }

    [Fact]
    public async Task Checkout_NegativeLegacyCouponRejected()
    {
        await using var context = TestDbContextFactory.Create();
        var data = await SeedCartAsync(context);
        context.Coupons.Add(new Coupon { Code = "NEGATIVE", DiscountType = DiscountType.FixedAmount, DiscountValue = -50, TotalUsageLimit = 5, ExpirationDateUtc = DateTime.UtcNow.AddDays(1) });
        await context.SaveChangesAsync();
        await Assert.ThrowsAsync<ConflictException>(() => CreateHandler(context).Handle(OrderCommand(data.User.Id, "NEGATIVE"), default));
        data.Product.StockQuantity.Should().Be(5);
    }

    [Fact]
    public async Task Checkout_ChangedDisplayedTotalRejectedAndFinancialSnapshotStored()
    {
        await using var context = TestDbContextFactory.Create();
        var data = await SeedCartAsync(context);
        var quote = await new GetCartQuoteQueryHandler(context).Handle(new GetCartQuoteQuery(data.User.Id), default);
        quote.Data!.TotalAmount.Should().Be(129.90m);
        await Assert.ThrowsAsync<ConflictException>(() => CreateHandler(context).Handle(OrderCommand(data.User.Id, expected: 100), default));
        var order = await CreateHandler(context).Handle(OrderCommand(data.User.Id, expected: 129.90m), default);
        order.Data!.Subtotal.Should().Be(100); order.Data.ShippingFee.Should().Be(29.90m); order.Data.DiscountAmount.Should().Be(0);
        data.Product.StockQuantity.Should().Be(4);
    }

    [Theory]
    [InlineData(OrderStatus.Paid, OrderStatus.Delivered)]
    [InlineData(OrderStatus.Processing, OrderStatus.Paid)]
    [InlineData(OrderStatus.Shipped, OrderStatus.Cancelled)]
    public void OrderStatus_InvalidTransitionsRejected(OrderStatus from, OrderStatus to)
    {
        var order = new Order { Status = from };
        Assert.Throws<ConflictException>(() => order.ChangeStatus(to));
        order.Status.Should().Be(from);
    }

    [Fact]
    public void OrderStatus_UndefinedEnumRejected()
    {
        var order = new Order { Status = OrderStatus.Paid };
        Assert.Throws<BusinessValidationException>(() => order.ChangeStatus((OrderStatus)999));
    }

    [Fact]
    public async Task AdminStatusPatch_DoesNotOverwriteStockAndStaleEditRejected()
    {
        await using var context = TestDbContextFactory.Create();
        var data = await SeedCartAsync(context, 9);
        await new UpdateProductStatusCommandHandler(context).Handle(new UpdateProductStatusCommand(data.Product.Id, false), default);
        data.Product.StockQuantity.Should().Be(9);
        var command = new UpdateProductCommand(data.Product.Id, "Ürün", data.Product.SKU, null, 100, 10, data.Product.CategoryId, data.Product.BrandId, true, Version: 2);
        await Assert.ThrowsAsync<ConflictException>(() => new UpdateProductCommandHandler(context).Handle(command, default));
        data.Product.StockQuantity.Should().Be(9);
    }

    [Fact]
    public void CouponValidator_RejectsNegativeDiscountAndUndefinedType()
    {
        var command = new CreateCouponCommand("TEST", (DiscountType)999, -50, -1, -1, 0, DateTime.UtcNow.AddDays(-1));
        var result = new CreateCouponCommandValidator().Validate(command);
        result.IsValid.Should().BeFalse();
        result.Errors.Select(e => e.PropertyName).Should().Contain(["DiscountType", "DiscountValue", "MinimumOrderAmount", "MaximumDiscountAmount", "TotalUsageLimit", "ExpirationDateUtc"]);
    }

    [Fact]
    public async Task OrderStatus_NotificationFailureDoesNotUndoCommittedStatus()
    {
        await using var context = TestDbContextFactory.Create();
        var data = await SeedCartAsync(context);
        var order = new Order { User = data.User, OrderNumber = "NX-TEST", ShippingAddress = "Adres", TotalAmount = 100, Status = OrderStatus.Paid };
        context.Orders.Add(order); await context.SaveChangesAsync();
        var notifications = new Mock<IRealTimeNotificationService>();
        notifications.Setup(n => n.PublishToUserAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>())).ThrowsAsync(new InvalidOperationException("Offline"));
        var result = await new UpdateOrderStatusCommandHandler(context, notifications.Object, Mock.Of<IEmailService>(), NullLogger<UpdateOrderStatusCommandHandler>.Instance)
            .Handle(new UpdateOrderStatusCommand(order.Id, OrderStatus.Processing), default);
        result.IsSuccess.Should().BeTrue(); order.Status.Should().Be(OrderStatus.Processing);
    }
}
