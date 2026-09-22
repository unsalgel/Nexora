using FluentAssertions;
using Nexora.Application.Features.Products.Commands.CreateProduct;
using Nexora.Application.Features.Products.Commands.DeleteProduct;
using Nexora.Application.Features.Products.Commands.UpdateProduct;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Products;

public sealed class ProductCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;

    public ProductCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task CreateProduct_WhenDuplicateSKU_ThrowsConflictException()
    {
        var category = new Category { Name = "Elektronik" };
        var brand = new Brand { Name = "Apple" };
        _context.Categories.Add(category);
        _context.Brands.Add(brand);

        var existingProduct = new Product
        {
            Name = "iPhone 15",
            SKU = "NX-IPH-01",
            Price = 50000,
            StockQuantity = 10,
            CategoryId = category.Id,
            BrandId = brand.Id
        };
        _context.Products.Add(existingProduct);
        await _context.SaveChangesAsync();

        var handler = new CreateProductCommandHandler(_context);
        var command = new CreateProductCommand(
            "iPhone 15 Pro",
            "NX-IPH-01",
            "Açıklama",
            60000,
            5,
            category.Id,
            brand.Id,
            null);

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("Bu SKU koduna sahip bir ürün zaten mevcut.");
    }

    [Fact]
    public async Task CreateProduct_WhenCategoryNotFound_ThrowsNotFoundException()
    {
        var brand = new Brand { Name = "Samsung" };
        _context.Brands.Add(brand);
        await _context.SaveChangesAsync();

        var handler = new CreateProductCommandHandler(_context);
        var command = new CreateProductCommand(
            "Galaxy S24",
            "NX-SAM-01",
            "Açıklama",
            40000,
            10,
            Guid.NewGuid(),
            brand.Id,
            null);

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("Seçilen kategori bulunamadı.");
    }

    [Fact]
    public async Task CreateProduct_WhenValid_CreatesSuccessfully()
    {
        var category = new Category { Name = "Bilgisayar" };
        var brand = new Brand { Name = "Dell" };
        _context.Categories.Add(category);
        _context.Brands.Add(brand);
        await _context.SaveChangesAsync();

        var handler = new CreateProductCommandHandler(_context);
        var command = new CreateProductCommand(
            "XPS 15",
            "NX-DEL-01",
            "Performanslı Laptop",
            75000,
            8,
            category.Id,
            brand.Id,
            new List<string> { "https://cdn.nexora.com/xps1.jpg" });

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Message.Should().Be("Ürün başarıyla oluşturuldu.");

        var savedProduct = _context.Products.FirstOrDefault(p => p.Id == result.Data);
        savedProduct.Should().NotBeNull();
        savedProduct!.Name.Should().Be("XPS 15");
        savedProduct.StockQuantity.Should().Be(8);
    }

    [Fact]
    public async Task DeleteProduct_WhenExists_SoftDeletesSuccessfully()
    {
        var category = new Category { Name = "Ev" };
        var brand = new Brand { Name = "Philips" };
        _context.Categories.Add(category);
        _context.Brands.Add(brand);

        var product = new Product
        {
            Name = "Airfryer",
            SKU = "NX-PHI-01",
            Price = 4000,
            StockQuantity = 15,
            CategoryId = category.Id,
            BrandId = brand.Id,
            IsDeleted = false
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var handler = new DeleteProductCommandHandler(_context);
        var command = new DeleteProductCommand(product.Id);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().Be("Ürün başarıyla silindi.");
        product.IsDeleted.Should().BeTrue();
    }
}
