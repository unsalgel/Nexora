using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Auth.Commands.Register;
using Nexora.Application.Features.Brands.Commands.UpdateBrandStatus;
using Nexora.Application.Features.Categories.Commands.UpdateCategoryStatus;
using Nexora.Application.Features.Chat.Commands.SendMessage;
using Nexora.Application.Features.Orders.Dtos;
using Nexora.Application.Features.Products.Commands.UpdateProduct;
using Nexora.Application.Features.Products.Commands.UpdateProductStatus;
using Nexora.Application.Features.Settings;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.UnitTests.Common;
using Nexora.UnitTests.Features.Orders;

namespace Nexora.UnitTests.Features;

public sealed class ReviewFixTests
{
    [Fact]
    public async Task OrderRetry_UsesPersistedOrder_AfterCartIsEmpty_WithoutPayingAgain()
    {
        using var db = TestDbContextFactory.Create();
        var data = await CommerceRegressionTests.SeedCartAsync(db);
        var payment = new Mock<IPaymentService>();
        var handler = CommerceRegressionTests.CreateHandler(db, payment);
        var command = CommerceRegressionTests.OrderCommand(data.User.Id, expected: 129.90m) with { IdempotencyKey = "retry-1" };
        var first = (await handler.Handle(command, default)).Data!;
        db.ChangeTracker.Clear();
        var retry = (await CommerceRegressionTests.CreateHandler(db, payment).Handle(command, default)).Data!;
        retry.Should().BeEquivalentTo(first);
        (await db.CartItems.CountAsync()).Should().Be(0);
        (await db.Products.SingleAsync()).StockQuantity.Should().Be(4);
        (await db.Orders.CountAsync()).Should().Be(1);
        payment.Verify(p => p.ProcessPaymentAsync(It.IsAny<decimal>(), It.IsAny<PaymentRequestDto>(), It.IsAny<CancellationToken>()), Times.Once);
        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(command with { ShippingAddress = "Different address" }, default));
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Activation_RejectsDeletedCatalogRelation(bool deleteBrand)
    {
        using var db = TestDbContextFactory.Create();
        var data = await CommerceRegressionTests.SeedCartAsync(db);
        data.Product.IsActive = false;
        if (deleteBrand) data.Product.Brand.IsDeleted = true;
        else data.Product.Category.IsDeleted = true;
        await db.SaveChangesAsync();
        await Assert.ThrowsAsync<NotFoundException>(() => new UpdateProductStatusCommandHandler(db)
            .Handle(new(data.Product.Id, true), default));
        data.Product.IsActive.Should().BeFalse();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task MainImageRemoval_IsExplicit_AndPromotesOnlyOneRemainingImage(bool remove)
    {
        using var db = TestDbContextFactory.Create();
        var data = await CommerceRegressionTests.SeedCartAsync(db);
        db.ProductImages.AddRange(new ProductImage { ProductId = data.Product.Id, ImageUrl = "/uploads/main.webp", IsMain = true },
            new ProductImage { ProductId = data.Product.Id, ImageUrl = "/uploads/next.webp", DisplayOrder = 1 });
        await db.SaveChangesAsync();
        var p = data.Product;
        await new UpdateProductCommandHandler(db).Handle(new(p.Id, p.Name, p.SKU, p.Description, p.Price, p.StockQuantity,
            p.CategoryId, p.BrandId, p.IsActive, Version: p.Version, RemoveMainImage: remove), default);
        var images = await db.ProductImages.ToListAsync();
        images.Count.Should().Be(remove ? 1 : 2);
        images.Single(i => i.IsMain).ImageUrl.Should().Be(remove ? "/uploads/next.webp" : "/uploads/main.webp");
    }

    [Fact]
    public async Task StatusCommands_PreserveCurrentNamesDescriptionsAndRelationships()
    {
        using var db = TestDbContextFactory.Create();
        var data = await CommerceRegressionTests.SeedCartAsync(db);
        var brand = data.Product.Brand; brand.Name = "New brand"; brand.LogoUrl = "/uploads/current.webp";
        var category = data.Product.Category; category.Name = "New category"; category.Description = "Current description";
        var parent = new Category { Name = "Parent" }; db.Categories.Add(parent); category.ParentCategoryId = parent.Id;
        await db.SaveChangesAsync();
        await new UpdateBrandStatusCommandHandler(db, Mock.Of<IRealTimeNotificationService>(), NullLogger<UpdateBrandStatusCommandHandler>.Instance)
            .Handle(new(brand.Id, false), default);
        await new UpdateCategoryStatusCommandHandler(db, Mock.Of<IRealTimeNotificationService>(), NullLogger<UpdateCategoryStatusCommandHandler>.Instance)
            .Handle(new(category.Id, false), default);
        brand.Name.Should().Be("New brand"); brand.LogoUrl.Should().Be("/uploads/current.webp"); brand.IsActive.Should().BeFalse();
        category.Name.Should().Be("New category"); category.Description.Should().Be("Current description");
        category.ParentCategoryId.Should().Be(parent.Id); category.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task Registration_ExistingAndNewEmailHaveSameResponse_WithoutChangingExistingAccount()
    {
        using var db = TestDbContextFactory.Create();
        var email = new Mock<IEmailService>();
        var handler = new RegisterCommandHandler(db, Mock.Of<IPasswordHasher>(h => h.Hash(It.IsAny<string>()) == "hash"), email.Object, TestSecurity.Protector);
        var command = new RegisterCommand("First", "Last", "same@example.test", "Password123");
        var first = await handler.Handle(command, default);
        var existing = await handler.Handle(command with { FirstName = "Attacker" }, default);
        existing.Should().BeEquivalentTo(first);
        (await db.Users.SingleAsync()).FirstName.Should().Be("First");
        (await db.EmailVerificationCodes.CountAsync()).Should().Be(1);
        email.Verify(e => e.SendEmailVerificationCodeEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AiShippingPrompt_UsesTheSameConfiguredPolicyAsPricing()
    {
        using var db = TestDbContextFactory.Create();
        db.Settings.AddRange(new Setting { Key = "FreeShippingThreshold", Value = "750" }, new Setting { Key = "ShippingCost", Value = "42.50" });
        await db.SaveChangesAsync();
        var ai = new Mock<IAiChatService>();
        string? prompt = null;
        ai.Setup(a => a.GenerateResponseAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Callback<string, string, CancellationToken>((system, _, _) => prompt = system).ReturnsAsync("Merhaba");
        await new SendChatMessageCommandHandler(db, ai.Object).Handle(new("Kargo?", null), default);
        prompt.Should().Contain("750 TL").And.Contain("42.50 TL").And.NotContain("14 gün").And.NotContain("tek tıkla talep");
        var policy = await ShippingPolicy.LoadAsync(db, default);
        policy.CalculateFee(749).Should().Be(42.50m); policy.CalculateFee(750).Should().Be(0);
    }
}
