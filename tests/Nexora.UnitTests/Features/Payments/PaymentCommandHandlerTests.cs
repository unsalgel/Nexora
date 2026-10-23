using FluentAssertions;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Payments.Commands.CompletePayment;
using Nexora.Application.Features.Payments.Commands.InitializePayment;
using Nexora.Application.Features.Payments.Dtos;
using Nexora.Domain.Entities;
using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;
using DomainCart = Nexora.Domain.Entities.Cart;

namespace Nexora.UnitTests.Features.Payments;

public sealed class PaymentCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;
    private readonly Mock<IPaymentGateway> _paymentGatewayMock;
    private readonly Mock<IEmailService> _emailServiceMock;

    public PaymentCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
        _paymentGatewayMock = new Mock<IPaymentGateway>();
        _emailServiceMock = new Mock<IEmailService>();
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task InitializePayment_WhenCartEmpty_ThrowsValidationException()
    {
        var user = new User { FirstName = "Ali", LastName = "Yilmaz", Email = "ali@nexora.com", PasswordHash = "hash" };
        _context.Users.Add(user);
        var cart = new DomainCart { UserId = user.Id };
        _context.Carts.Add(cart);
        await _context.SaveChangesAsync();

        var handler = new InitializePaymentCommandHandler(_context, _paymentGatewayMock.Object);
        var command = new InitializePaymentCommand("Kadikoy, Istanbul") { UserId = user.Id };

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<BusinessValidationException>()
            .WithMessage("Sepetinizde ürün bulunmamaktadır.");
    }

    [Fact]
    public async Task InitializePayment_WhenGatewaySucceeds_CreatesPendingOrderAndReturnsToken()
    {
        var user = new User { FirstName = "Ali", LastName = "Yilmaz", Email = "ali@nexora.com", PasswordHash = "hash" };
        _context.Users.Add(user);

        var category = new Category { Name = "Elektronik" };
        _context.Categories.Add(category);

        var product = new Product { Name = "Kulaklik", SKU = "KLK-01", Price = 500, StockQuantity = 10, CategoryId = category.Id, Category = category };
        _context.Products.Add(product);

        var cart = new DomainCart { UserId = user.Id };
        cart.Items.Add(new CartItem { CartId = cart.Id, ProductId = product.Id, Product = product, Quantity = 2 });
        _context.Carts.Add(cart);
        await _context.SaveChangesAsync();

        _paymentGatewayMock
            .Setup(g => g.InitializePaymentAsync(It.IsAny<PaymentInitializationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PaymentInitializationResult(true, "mock-token-123", "<script>mock</script>", null, null));

        var handler = new InitializePaymentCommandHandler(_context, _paymentGatewayMock.Object);
        var command = new InitializePaymentCommand("Kadikoy, Istanbul") { UserId = user.Id };

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Token.Should().Be("mock-token-123");

        var createdOrder = _context.Orders.FirstOrDefault(o => o.UserId == user.Id);
        createdOrder.Should().NotBeNull();
        createdOrder!.Status.Should().Be(OrderStatus.Pending);
        createdOrder.PaymentStatus.Should().Be(PaymentStatus.Pending);
        createdOrder.IdempotencyKey.Should().Be("mock-token-123");
    }

    [Fact]
    public async Task CompletePayment_WhenTokenInvalid_ReturnsFailure()
    {
        var handler = new CompletePaymentCommandHandler(_context, _paymentGatewayMock.Object, _emailServiceMock.Object);
        var command = new CompletePaymentCommand("   ");

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("geçersiz");
    }

    [Fact]
    public async Task CompletePayment_WhenGatewayFails_CancelsOrderAndSetsPaymentFailed()
    {
        var user = new User { FirstName = "Ali", LastName = "Yilmaz", Email = "ali@nexora.com", PasswordHash = "hash" };
        _context.Users.Add(user);

        var order = new Order
        {
            OrderNumber = "NX-TEST-001",
            UserId = user.Id,
            ShippingAddress = "Istanbul",
            TotalAmount = 1000,
            Status = OrderStatus.Pending,
            PaymentStatus = PaymentStatus.Pending,
            IdempotencyKey = "failed-token-999"
        };
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        _paymentGatewayMock
            .Setup(g => g.VerifyPaymentAsync(It.IsAny<PaymentVerificationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PaymentVerificationResult(false, null, "NX-TEST-001", 0, "Bakiye yetersiz."));

        var handler = new CompletePaymentCommandHandler(_context, _paymentGatewayMock.Object, _emailServiceMock.Object);
        var command = new CompletePaymentCommand("failed-token-999");

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        order.Status.Should().Be(OrderStatus.Cancelled);
        order.PaymentStatus.Should().Be(PaymentStatus.Failed);
    }

    [Fact]
    public async Task CompletePayment_WhenGatewaySucceeds_UpdatesOrderToPaidDecreasesStockAndClearsCart()
    {
        var user = new User { FirstName = "Ali", LastName = "Yilmaz", Email = "ali@nexora.com", PasswordHash = "hash" };
        _context.Users.Add(user);

        var product = new Product { Name = "Telefon", SKU = "TLF-01", Price = 1000, StockQuantity = 5 };
        _context.Products.Add(product);

        var cart = new DomainCart { UserId = user.Id };
        cart.Items.Add(new CartItem { CartId = cart.Id, ProductId = product.Id, Product = product, Quantity = 1 });
        _context.Carts.Add(cart);

        var order = new Order
        {
            OrderNumber = "NX-TEST-002",
            UserId = user.Id,
            ShippingAddress = "Istanbul",
            TotalAmount = 1000,
            Status = OrderStatus.Pending,
            PaymentStatus = PaymentStatus.Pending,
            IdempotencyKey = "success-token-888"
        };
        order.Items.Add(new OrderItem
        {
            OrderId = order.Id,
            ProductId = product.Id,
            ProductName = product.Name,
            UnitPrice = 1000,
            Quantity = 1,
            TotalPrice = 1000
        });
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        _paymentGatewayMock
            .Setup(g => g.VerifyPaymentAsync(It.IsAny<PaymentVerificationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PaymentVerificationResult(true, "pay-id-123", "NX-TEST-002", 1000, null));

        var handler = new CompletePaymentCommandHandler(_context, _paymentGatewayMock.Object, _emailServiceMock.Object);
        var command = new CompletePaymentCommand("success-token-888");

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        order.Status.Should().Be(OrderStatus.Paid);
        order.PaymentStatus.Should().Be(PaymentStatus.Success);
        product.StockQuantity.Should().Be(4);
        cart.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task CompletePayment_WhenAmountMismatches_RejectsAndMarksFailed()
    {
        var user = new User { FirstName = "Ali", LastName = "Yilmaz", Email = "ali@nexora.com", PasswordHash = "hash" };
        _context.Users.Add(user);

        var order = new Order
        {
            OrderNumber = "NX-TEST-003",
            UserId = user.Id,
            ShippingAddress = "Istanbul",
            TotalAmount = 1500,
            Status = OrderStatus.Pending,
            PaymentStatus = PaymentStatus.Pending,
            IdempotencyKey = "tamper-token-777"
        };
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        _paymentGatewayMock
            .Setup(g => g.VerifyPaymentAsync(It.IsAny<PaymentVerificationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PaymentVerificationResult(true, "pay-id-tamper", "NX-TEST-003", 100, null));

        var handler = new CompletePaymentCommandHandler(_context, _paymentGatewayMock.Object, _emailServiceMock.Object);
        var command = new CompletePaymentCommand("tamper-token-777");

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("uyuşmuyor");
        order.Status.Should().Be(OrderStatus.Cancelled);
        order.PaymentStatus.Should().Be(PaymentStatus.Failed);
    }
}
