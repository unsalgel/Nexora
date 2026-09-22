using FluentAssertions;
using Nexora.Application.Features.Cart.Commands.AddItemToCart;
using Nexora.Application.Features.Cart.Commands.ClearCart;
using Nexora.Application.Features.Cart.Commands.RemoveItemFromCart;
using Nexora.Application.Features.Cart.Commands.UpdateCartItemQuantity;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Cart;

public sealed class CartCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;

    public CartCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task AddItemToCart_WhenProductNotFound_ThrowsNotFoundException()
    {
        var handler = new AddItemToCartCommandHandler(_context);
        var command = new AddItemToCartCommand(Guid.NewGuid(), Guid.NewGuid(), null, 1);

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("Sepete eklenecek ürün bulunamadı.");
    }

    [Fact]
    public async Task AddItemToCart_WhenStockInsufficient_ThrowsConflictException()
    {
        var product = new Product
        {
            Name = "Laptop",
            SKU = "PRD-LAP-001",
            Price = 15000,
            StockQuantity = 2,
            IsActive = true
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var handler = new AddItemToCartCommandHandler(_context);
        var command = new AddItemToCartCommand(Guid.NewGuid(), product.Id, null, 5);

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("Yetersiz stok. Mevcut stok: 2");
    }

    [Fact]
    public async Task AddItemToCart_WhenValid_AddsSuccessfully()
    {
        var product = new Product
        {
            Name = "Kulaklık",
            SKU = "PRD-KUL-001",
            Price = 500,
            StockQuantity = 10,
            IsActive = true
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var userId = Guid.NewGuid();
        var handler = new AddItemToCartCommandHandler(_context);
        var command = new AddItemToCartCommand(userId, product.Id, null, 2);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Message.Should().Be("Ürün başarıyla sepete eklendi.");
    }

    [Fact]
    public async Task UpdateCartItemQuantity_WhenStockExceeded_ThrowsConflictException()
    {
        var userId = Guid.NewGuid();
        var product = new Product
        {
            Name = "Telefon",
            SKU = "PRD-TEL-001",
            Price = 20000,
            StockQuantity = 3,
            IsActive = true
        };
        _context.Products.Add(product);

        var cart = new Domain.Entities.Cart { UserId = userId };
        var cartItem = new CartItem { Product = product, Quantity = 1 };
        cart.Items.Add(cartItem);
        _context.Carts.Add(cart);
        await _context.SaveChangesAsync();

        var handler = new UpdateCartItemQuantityCommandHandler(_context);
        var command = new UpdateCartItemQuantityCommand(userId, cartItem.Id, 10);

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("Yetersiz stok. Mevcut stok: 3");
    }

    [Fact]
    public async Task RemoveItemFromCart_WhenExists_RemovesSuccessfully()
    {
        var userId = Guid.NewGuid();
        var product = new Product
        {
            Name = "Mouse",
            SKU = "PRD-MOU-001",
            Price = 300,
            StockQuantity = 10,
            IsActive = true
        };
        _context.Products.Add(product);

        var cart = new Domain.Entities.Cart { UserId = userId };
        var cartItem = new CartItem { Product = product, Quantity = 1 };
        cart.Items.Add(cartItem);
        _context.Carts.Add(cart);
        await _context.SaveChangesAsync();

        var handler = new RemoveItemFromCartCommandHandler(_context);
        var command = new RemoveItemFromCartCommand(userId, cartItem.Id);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().Be("Ürün sepetten çıkarıldı.");
        _context.CartItems.Should().BeEmpty();
    }

    [Fact]
    public async Task ClearCart_WhenCartHasItems_ClearsAllItems()
    {
        var userId = Guid.NewGuid();
        var product = new Product
        {
            Name = "Klavye",
            SKU = "PRD-KLA-001",
            Price = 1000,
            StockQuantity = 10,
            IsActive = true
        };
        _context.Products.Add(product);

        var cart = new Domain.Entities.Cart { UserId = userId };
        cart.Items.Add(new CartItem { Product = product, Quantity = 2 });
        _context.Carts.Add(cart);
        await _context.SaveChangesAsync();

        var handler = new ClearCartCommandHandler(_context);
        var command = new ClearCartCommand(userId);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().Be("Sepetiniz başarıyla temizlendi.");
        _context.CartItems.Should().BeEmpty();
    }
}
