using FluentAssertions;
using Nexora.Application.Features.Reviews.Commands.CreateReview;
using Nexora.Domain.Entities;
using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Reviews;

public sealed class CreateReviewCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;
    private readonly CreateReviewCommandHandler _handler;

    public CreateReviewCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
        _handler = new CreateReviewCommandHandler(_context);
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task Handle_WhenUserHasNotPurchasedProduct_ThrowsBusinessValidationException()
    {
        var category = new Category { Name = "Elektronik" };
        var brand = new Brand { Name = "TechBrand" };
        _context.Categories.Add(category);
        _context.Brands.Add(brand);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Akıllı Saat",
            SKU = "NX-TEST-WATCH-01",
            Price = 1500,
            StockQuantity = 10,
            CategoryId = category.Id,
            BrandId = brand.Id,
            IsActive = true,
            IsDeleted = false
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var userId = Guid.NewGuid();
        var command = new CreateReviewCommand(userId, product.Id, 5, "Harika bir saat!");

        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<BusinessValidationException>()
            .WithMessage("Yalnızca satın aldığınız ürünlere yorum yapabilirsiniz.");
    }

    [Fact]
    public async Task Handle_WhenUserPurchasedProduct_CreatesReviewSuccessfully()
    {
        var category = new Category { Name = "Donanım" };
        var brand = new Brand { Name = "GamerBrand" };
        _context.Categories.Add(category);
        _context.Brands.Add(brand);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Mekanik Klavye",
            SKU = "NX-TEST-KEYB-01",
            Price = 2000,
            StockQuantity = 5,
            CategoryId = category.Id,
            BrandId = brand.Id,
            IsActive = true,
            IsDeleted = false
        };
        _context.Products.Add(product);

        var userId = Guid.NewGuid();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "NX-REV-01",
            UserId = userId,
            ShippingAddress = "İstanbul",
            TotalAmount = 2000,
            Status = OrderStatus.Delivered,
            PaymentStatus = PaymentStatus.Success,
            Items = new List<OrderItem>
            {
                new()
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    UnitPrice = 2000,
                    Quantity = 1,
                    TotalPrice = 2000
                }
            }
        };
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var command = new CreateReviewCommand(userId, product.Id, 5, "Mükemmel klavye, çok memnun kaldım.");
        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Handle_WhenOrderPaymentFailed_ThrowsBusinessValidationException()
    {
        var category = new Category { Name = "Aksesuar" };
        var brand = new Brand { Name = "TestBrand" };
        _context.Categories.Add(category);
        _context.Brands.Add(brand);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Mousepad",
            SKU = "NX-TEST-PAD-01",
            Price = 300,
            StockQuantity = 10,
            CategoryId = category.Id,
            BrandId = brand.Id,
            IsActive = true,
            IsDeleted = false
        };
        _context.Products.Add(product);

        var userId = Guid.NewGuid();
        var failedOrder = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "NX-FAIL-01",
            UserId = userId,
            ShippingAddress = "Ankara",
            TotalAmount = 300,
            Status = OrderStatus.Cancelled,
            PaymentStatus = PaymentStatus.Failed,
            Items = new List<OrderItem>
            {
                new()
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    UnitPrice = 300,
                    Quantity = 1,
                    TotalPrice = 300
                }
            }
        };
        _context.Orders.Add(failedOrder);
        await _context.SaveChangesAsync();

        var command = new CreateReviewCommand(userId, product.Id, 5, "Ödeme başarısız ama yorum yapmaya çalışıyorum.");
        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<BusinessValidationException>()
            .WithMessage("Yalnızca satın aldığınız ürünlere yorum yapabilirsiniz.");
    }
}
