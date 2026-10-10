using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Features.Cart.Commands.AddItemToCart;
using Nexora.Application.Features.ProductVariants.Commands.CreateProductVariant;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Orders;

public sealed class CommerceVariantRegressionTests
{
    private static async Task<(ProductAttributeValue Red, ProductAttributeValue Blue, ProductAttributeValue Medium)> SeedAttributesAsync(Nexora.Persistence.Context.NexoraDbContext context)
    {
        var color = new ProductAttribute { Name = "Renk" };
        var size = new ProductAttribute { Name = "Beden" };
        var red = new ProductAttributeValue { Value = "Kırmızı", ProductAttribute = color };
        var blue = new ProductAttributeValue { Value = "Mavi", ProductAttribute = color };
        var medium = new ProductAttributeValue { Value = "M", ProductAttribute = size };
        context.ProductAttributeValues.AddRange(red, blue, medium); await context.SaveChangesAsync();
        return (red, blue, medium);
    }

    [Fact]
    public async Task VariantCannotSelectTwoDifferentValuesForSameAttribute()
    {
        await using var context = TestDbContextFactory.Create(); var data = await CommerceRegressionTests.SeedCartAsync(context);
        var values = await SeedAttributesAsync(context);
        await Assert.ThrowsAsync<BusinessValidationException>(() => new CreateProductVariantCommandHandler(context)
            .Handle(new(data.Product.Id, "CONFLICT-COLOR", 100, 5, [values.Red.Id, values.Blue.Id]), default));
        (await context.ProductVariants.CountAsync()).Should().Be(0);
        (await context.ProductVariantAttributeValues.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task DuplicateCombinationIsRejectedRegardlessOfValueOrder()
    {
        await using var context = TestDbContextFactory.Create(); var data = await CommerceRegressionTests.SeedCartAsync(context);
        var values = await SeedAttributesAsync(context); var handler = new CreateProductVariantCommandHandler(context);
        var first = await handler.Handle(new(data.Product.Id, "RED-M-FIRST", 100, 5, [values.Red.Id, values.Medium.Id]), default);
        first.IsSuccess.Should().BeTrue();
        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(new(data.Product.Id, "RED-M-OTHER-SKU", 90, 10, [values.Medium.Id, values.Red.Id]), default));
        (await context.ProductVariants.CountAsync()).Should().Be(1);
        (await context.ProductVariantAttributeValues.CountAsync()).Should().Be(2);
    }

    [Fact]
    public async Task ParentAndVariantRemainSeparateSellableStockAndPrice()
    {
        await using var context = TestDbContextFactory.Create(); var data = await CommerceRegressionTests.SeedCartAsync(context, 5);
        var variant = new ProductVariant { ProductId = data.Product.Id, SKU = "SEPARATE", Price = 50, StockQuantity = 7, Version = 1 };
        context.ProductVariants.Add(variant); await context.SaveChangesAsync();
        // Mevcut politika: varyantı olan ürün parent SKU ile de satılabilir; stokları bağımsızdır.
        var parentOrder = await CommerceRegressionTests.CreateHandler(context).Handle(CommerceRegressionTests.OrderCommand(data.User.Id), default);
        parentOrder.Data!.Items.Single().ProductVariantId.Should().BeNull();
        parentOrder.Data.Items.Single().UnitPrice.Should().Be(100);
        data.Product.StockQuantity.Should().Be(4); variant.StockQuantity.Should().Be(7);
        context.ChangeTracker.Clear();
        await new AddItemToCartCommandHandler(context).Handle(new(data.User.Id, data.Product.Id, variant.Id, 2), default);
        var variantOrder = await CommerceRegressionTests.CreateHandler(context).Handle(CommerceRegressionTests.OrderCommand(data.User.Id), default);
        variantOrder.Data!.Items.Single().ProductVariantId.Should().Be(variant.Id);
        variantOrder.Data.Items.Single().UnitPrice.Should().Be(50);
        (await context.Products.SingleAsync()).StockQuantity.Should().Be(4);
        (await context.ProductVariants.SingleAsync()).StockQuantity.Should().Be(5);
    }
}
