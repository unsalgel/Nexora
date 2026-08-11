using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.ProductVariants.Commands.CreateProductVariant;

public sealed class CreateProductVariantCommandHandler : IRequestHandler<CreateProductVariantCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateProductVariantCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateProductVariantCommand request, CancellationToken cancellationToken)
    {
        var productExists = await _context.Products
            .AnyAsync(p => p.Id == request.ProductId && !p.IsDeleted, cancellationToken);

        if (!productExists)
            throw new NotFoundException("Varyant eklenecek ürün bulunamadı.");

        var skuExists = await _context.ProductVariants
            .AnyAsync(v => v.SKU == request.SKU && !v.IsDeleted, cancellationToken);

        if (skuExists)
            throw new ConflictException("Bu SKU koduna sahip bir varyant zaten mevcut.");

        var validAttributeValuesCount = await _context.ProductAttributeValues
            .CountAsync(v => request.AttributeValueIds.Contains(v.Id), cancellationToken);

        if (validAttributeValuesCount != request.AttributeValueIds.Count)
            throw new NotFoundException("Seçilen özellik değerlerinden bazıları bulunamadı.");

        var variant = new ProductVariant
        {
            ProductId = request.ProductId,
            SKU = request.SKU,
            Price = request.Price,
            StockQuantity = request.StockQuantity,
            IsActive = true,
            IsDeleted = false
        };

        foreach (var attrValId in request.AttributeValueIds)
        {
            variant.VariantAttributeValues.Add(new ProductVariantAttributeValue
            {
                ProductAttributeValueId = attrValId
            });
        }

        _context.ProductVariants.Add(variant);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(variant.Id, "Ürün varyantı başarıyla oluşturuldu.");
    }
}
