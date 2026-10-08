using FluentAssertions;
using Nexora.Application.Features.Brands.Commands.CreateBrand;
using Nexora.Application.Features.Brands.Commands.UpdateBrand;
using Nexora.Application.Features.Categories.Commands.CreateCategory;
using Nexora.Application.Features.Categories.Commands.UpdateCategory;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.CategoriesAndBrands;

public sealed class CategoryAndBrandCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;

    public CategoryAndBrandCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task CreateCategory_WhenNameAlreadyExists_ThrowsConflictException()
    {
        var existing = new Category { Name = "Giyim" };
        _context.Categories.Add(existing);
        await _context.SaveChangesAsync();

        var handler = new CreateCategoryCommandHandler(_context);
        var command = new CreateCategoryCommand("Giyim", "Açıklama", null);

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("Bu isimde bir kategori zaten mevcut.");
    }

    [Fact]
    public async Task CreateCategory_WhenParentNotFound_ThrowsNotFoundException()
    {
        var handler = new CreateCategoryCommandHandler(_context);
        var command = new CreateCategoryCommand("Erkek Ayakkabı", "Açıklama", Guid.NewGuid());

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("Seçilen üst kategori bulunamadı.");
    }

    [Fact]
    public async Task CreateCategory_WhenValid_CreatesSuccessfully()
    {
        var handler = new CreateCategoryCommandHandler(_context);
        var command = new CreateCategoryCommand("Kitap", "Roman ve Eğitim kitapları", null);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Message.Should().Be("Kategori başarıyla oluşturuldu.");

        var saved = _context.Categories.FirstOrDefault(c => c.Id == result.Data);
        saved.Should().NotBeNull();
        saved!.Name.Should().Be("Kitap");
    }

    [Fact]
    public async Task CreateBrand_WhenNameAlreadyExists_ThrowsConflictException()
    {
        var existing = new Brand { Name = "Nike" };
        _context.Brands.Add(existing);
        await _context.SaveChangesAsync();

        var handler = new CreateBrandCommandHandler(_context);
        var command = new CreateBrandCommand("Nike", "https://cdn.nexora.com/nike.png");

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("Bu isimde bir marka zaten mevcut.");
    }

    [Fact]
    public async Task CreateBrand_WhenValid_CreatesSuccessfully()
    {
        var handler = new CreateBrandCommandHandler(_context);
        var command = new CreateBrandCommand("Adidas", "https://cdn.nexora.com/adidas.png");

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Message.Should().Be("Marka başarıyla oluşturuldu.");

        var saved = _context.Brands.FirstOrDefault(b => b.Id == result.Data);
        saved.Should().NotBeNull();
        saved!.Name.Should().Be("Adidas");
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task UpdateBrand_WhenValid_UpdatesIsActiveProperly(bool targetStatus)
    {
        var brand = new Brand
        {
            Id = Guid.NewGuid(),
            Name = "Puma",
            LogoUrl = "https://cdn.nexora.com/puma.png",
            IsActive = !targetStatus
        };
        _context.Brands.Add(brand);
        await _context.SaveChangesAsync();

        var handler = new UpdateBrandCommandHandler(_context);
        var command = new UpdateBrandCommand(brand.Id, "Puma", "https://cdn.nexora.com/puma.png", targetStatus);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        var updated = _context.Brands.FirstOrDefault(b => b.Id == brand.Id);
        updated.Should().NotBeNull();
        updated!.IsActive.Should().Be(targetStatus);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task UpdateCategory_WhenValid_UpdatesIsActiveProperly(bool targetStatus)
    {
        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Aksesuar",
            Description = "Saat, Gözlük",
            IsActive = !targetStatus
        };
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        var handler = new UpdateCategoryCommandHandler(_context);
        var command = new UpdateCategoryCommand(category.Id, "Aksesuar", "Saat, Gözlük", null, targetStatus);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        var updated = _context.Categories.FirstOrDefault(c => c.Id == category.Id);
        updated.Should().NotBeNull();
        updated!.IsActive.Should().Be(targetStatus);
    }

    [Fact]
    public async Task UpdateCategory_WhenNotificationServiceProvided_PublishesCategoryStatusChanged()
    {
        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Spor",
            Description = "Spor malzemeleri",
            IsActive = true
        };
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        var notificationMock = new Moq.Mock<Nexora.Application.Abstractions.IRealTimeNotificationService>();
        var handler = new UpdateCategoryCommandHandler(_context, notificationMock.Object);
        var command = new UpdateCategoryCommand(category.Id, "Spor & Outdoor", "Güncel açıklama", null, false);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        notificationMock.Verify(
            n => n.PublishToAllAsync(
                "CategoryStatusChanged",
                Moq.It.IsAny<object>(),
                Moq.It.IsAny<CancellationToken>()),
            Moq.Times.Once);
    }
}
