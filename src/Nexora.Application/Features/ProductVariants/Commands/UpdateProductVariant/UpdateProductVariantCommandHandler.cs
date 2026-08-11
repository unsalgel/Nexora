using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.ProductVariants.Commands.UpdateProductVariant;

public sealed class UpdateProductVariantCommandHandler : IRequestHandler<UpdateProductVariantCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;

    public UpdateProductVariantCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(UpdateProductVariantCommand request, CancellationToken cancellationToken)
    {
        var variant = await _context.ProductVariants
            .FirstOrDefaultAsync(v => v.Id == request.Id && !v.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Güncellenecek varyant bulunamadı.");

        var skuExists = await _context.ProductVariants
            .AnyAsync(v => v.SKU == request.SKU && v.Id != request.Id && !v.IsDeleted, cancellationToken);

        if (skuExists)
            throw new ConflictException("Bu SKU koduna sahip başka bir varyant zaten mevcut.");

        variant.SKU = request.SKU;
        variant.Price = request.Price;
        variant.StockQuantity = request.StockQuantity;
        variant.IsActive = request.IsActive;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success("Ürün varyantı ve stok bilgisi başarıyla güncellendi.");
    }
}
