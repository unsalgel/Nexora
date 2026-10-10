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
        await using var transaction = await _context.BeginTransactionAsync($"variants:{request.ProductId}", cancellationToken);
        var productExists = await _context.Products
            .AnyAsync(p => p.Id == request.ProductId && !p.IsDeleted, cancellationToken);

        if (!productExists)
            throw new NotFoundException("Varyant eklenecek ürün bulunamadı.");

        var skuExists = await _context.ProductVariants
            .AnyAsync(v => v.SKU == request.SKU, cancellationToken);

        if (skuExists)
            throw new ConflictException("Bu SKU koduna sahip bir varyant zaten mevcut.");

        var values = await _context.ProductAttributeValues.AsNoTracking()
            .Where(v => request.AttributeValueIds.Contains(v.Id))
            .Select(v => new { v.Id, v.ProductAttributeId }).ToListAsync(cancellationToken);

        if (values.Count != request.AttributeValueIds.Count)
            throw new NotFoundException("Seçilen özellik değerlerinden bazıları bulunamadı.");
        if (values.Select(v => v.ProductAttributeId).Distinct().Count() != values.Count)
            throw new BusinessValidationException("Aynı özellik için yalnız bir değer seçilebilir.");
        var combinationExists = await _context.ProductVariants.AnyAsync(v => v.ProductId == request.ProductId && !v.IsDeleted &&
            v.VariantAttributeValues.Count == values.Count && v.VariantAttributeValues.All(a => request.AttributeValueIds.Contains(a.ProductAttributeValueId)), cancellationToken);
        if (combinationExists) throw new ConflictException("Bu özellik kombinasyonuna sahip bir varyant zaten mevcut.");

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
        await transaction.CommitAsync(cancellationToken);

        return Result<Guid>.Success(variant.Id, "Ürün varyantı başarıyla oluşturuldu.");
    }
}
