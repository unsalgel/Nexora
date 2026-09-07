using FluentAssertions;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Orders.Commands.CreateOrder;
using Nexora.Application.Features.Orders.Dtos;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Orders;

public sealed class CreateOrderCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;
    private readonly Mock<IPaymentService> _paymentServiceMock;
    private readonly CreateOrderCommandHandler _handler;

    public CreateOrderCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
        _paymentServiceMock = new Mock<IPaymentService>();

        _handler = new CreateOrderCommandHandler(_context, _paymentServiceMock.Object);
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task Handle_WhenCartNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var command = new CreateOrderCommand(
            Guid.NewGuid(),
            "İstanbul, Beşiktaş",
            new PaymentRequestDto("Ali Yılmaz", "1234567812345678", "12", "2028", "123")
        );

        // Act
        var act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("Kullanıcıya ait sepet bulunamadı.");
    }

    [Fact]
    public async Task Handle_WhenCartIsEmpty_ThrowsConflictException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart = new Cart
        {
            Id = Guid.NewGuid(),
            UserId = userId
        };
        _context.Carts.Add(cart);
        await _context.SaveChangesAsync();

        var command = new CreateOrderCommand(
            userId,
            "İstanbul, Beşiktaş",
            new PaymentRequestDto("Ali Yılmaz", "1234567812345678", "12", "2028", "123")
        );

        // Act
        var act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("Sepetinizde ürün bulunmamaktadır. Boş sepetle sipariş oluşturulamaz.");
    }

    [Fact]
    public async Task Handle_ValidOrder_CreatesOrderAndClearsCart()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var category = new Category { Id = Guid.NewGuid(), Name = "Elektronik" };
        _context.Categories.Add(category);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Kablosuz Kulaklık",
            SKU = "KUL-001",
            Price = 500m,
            StockQuantity = 10,
            CategoryId = category.Id,
            IsActive = true
        };
        _context.Products.Add(product);

        var cart = new Cart
        {
            Id = Guid.NewGuid(),
            UserId = userId
        };
        _context.Carts.Add(cart);

        var cartItem = new CartItem
        {
            Id = Guid.NewGuid(),
            CartId = cart.Id,
            ProductId = product.Id,
            Product = product,
            Quantity = 2
        };
        _context.CartItems.Add(cartItem);
        await _context.SaveChangesAsync();

        _paymentServiceMock
            .Setup(x => x.ProcessPaymentAsync(It.IsAny<decimal>(), It.IsAny<PaymentRequestDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var command = new CreateOrderCommand(
            userId,
            "İstanbul, Kadıköy",
            new PaymentRequestDto("Ali Yılmaz", "1234567812345678", "12", "2028", "123")
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.TotalAmount.Should().Be(1000m);
        result.Data.Items.Should().HaveCount(1);
        result.Data.OrderNumber.Should().StartWith("NX-");

        // Sepetin temizlendiğini doğrula
        var updatedCart = _context.Carts.Find(cart.Id);
        updatedCart.Should().NotBeNull();
        _context.CartItems.Count(ci => ci.CartId == cart.Id).Should().Be(0);

        // Ürün stoğunun düştüğünü doğrula (10 - 2 = 8)
        var updatedProduct = _context.Products.Find(product.Id);
        updatedProduct!.StockQuantity.Should().Be(8);
    }
}
