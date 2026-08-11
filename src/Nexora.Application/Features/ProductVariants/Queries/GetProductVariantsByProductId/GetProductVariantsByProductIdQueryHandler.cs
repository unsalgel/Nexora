using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.ProductVariants.Dtos;

namespace Nexora.Application.Features.ProductVariants.Queries.GetProductVariantsByProductId;

public sealed class GetProductVariantsByProductIdQueryHandler : IRequestHandler<GetProductVariantsByProductIdQuery, Result<List<ProductVariantDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetProductVariantsByProductIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<ProductVariantDto>>> Handle(GetProductVariantsByProductIdQuery request, CancellationToken cancellationToken)
    {
        var variants = await _context.ProductVariants
            .AsNoTracking()
            .Include(v => v.VariantAttributeValues)
                .ThenInclude(vav => vav.ProductAttributeValue)
            .Where(v => v.ProductId == request.ProductId && v.IsActive && !v.IsDeleted)
            .Select(v => new ProductVariantDto(
                v.Id,
                v.ProductId,
                v.SKU,
                v.Price,
                v.StockQuantity,
                v.IsActive,
                v.VariantAttributeValues.Select(vav => vav.ProductAttributeValue.Value).ToList()))
            .ToListAsync(cancellationToken);

        return Result<List<ProductVariantDto>>.Success(variants);
    }
}
