using FluentAssertions;
using Nexora.Application.Features.Addresses.Commands.CreateAddress;
using Nexora.Application.Features.Favorites.Commands.AddFavorite;
using Nexora.Application.Features.Favorites.Commands.RemoveFavorite;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.FavoritesAndAddresses;

public sealed class FavoritesAndAddressesCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;

    public FavoritesAndAddressesCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task AddFavorite_WhenProductNotFound_ThrowsNotFoundException()
    {
        var handler = new AddFavoriteCommandHandler(_context);
        var command = new AddFavoriteCommand(Guid.NewGuid(), Guid.NewGuid());

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("Favorilere eklenecek ürün bulunamadı.");
    }

    [Fact]
    public async Task AddFavorite_WhenValid_AddsSuccessfully()
    {
        var product = new Product
        {
            Name = "Akıllı Saat",
            SKU = "NX-SAAT-01",
            Price = 3000,
            StockQuantity = 15,
            IsActive = true
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var userId = Guid.NewGuid();
        var handler = new AddFavoriteCommandHandler(_context);
        var command = new AddFavoriteCommand(userId, product.Id);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Message.Should().Be("Ürün favorilere eklendi.");
        _context.Favorites.Should().ContainSingle(f => f.UserId == userId && f.ProductId == product.Id);
    }

    [Fact]
    public async Task AddFavorite_WhenAlreadyAdded_ThrowsConflictException()
    {
        var product = new Product
        {
            Name = "Kamera",
            SKU = "NX-KAM-01",
            Price = 8000,
            StockQuantity = 5,
            IsActive = true
        };
        _context.Products.Add(product);
        var userId = Guid.NewGuid();
        _context.Favorites.Add(new Favorite { UserId = userId, ProductId = product.Id });
        await _context.SaveChangesAsync();

        var handler = new AddFavoriteCommandHandler(_context);
        var command = new AddFavoriteCommand(userId, product.Id);

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("Bu ürün zaten favorilerinizde ekli.");
    }

    [Fact]
    public async Task CreateAddress_WhenFirstAddress_SetsAsDefaultAutomatically()
    {
        var userId = Guid.NewGuid();
        var handler = new CreateAddressCommandHandler(_context);
        var command = new CreateAddressCommand(
            userId,
            "Ev Adresim",
            "Mert Can",
            "05551234567",
            "İstanbul",
            "Kadıköy",
            "Moda Cad. No:5",
            "34710",
            IsDefault: false); // İlk adres olduğu için otomatik true olmalı

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.IsDefault.Should().BeTrue();
    }

    [Fact]
    public async Task CreateAddress_WhenSecondAddressSetAsDefault_UnsetsPreviousDefault()
    {
        var userId = Guid.NewGuid();
        var firstAddress = new UserAddress
        {
            UserId = userId,
            Title = "Ev",
            FullName = "Mert Can",
            PhoneNumber = "05551234567",
            City = "İstanbul",
            District = "Kadıköy",
            DetailedAddress = "Adres 1",
            IsDefault = true
        };
        _context.UserAddresses.Add(firstAddress);
        await _context.SaveChangesAsync();

        var handler = new CreateAddressCommandHandler(_context);
        var command = new CreateAddressCommand(
            userId,
            "İş",
            "Mert Can",
            "05551234567",
            "İstanbul",
            "Şişli",
            "Büyükdere Cad.",
            "34394",
            IsDefault: true);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data!.IsDefault.Should().BeTrue();
        firstAddress.IsDefault.Should().BeFalse();
    }
}
