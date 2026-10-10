using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Dashboard.Queries.GetInventorySummary;

public sealed record LowStockProductDto(Guid Id, string Name, string SKU, int StockQuantity, Guid? ProductVariantId);
public sealed record InventorySummaryDto(decimal TotalInventoryValue, int LowStockCount, List<LowStockProductDto> LowStockProducts);
public sealed record GetInventorySummaryQuery : IRequest<Result<InventorySummaryDto>>;

public sealed class GetInventorySummaryQueryHandler(IApplicationDbContext context) : IRequestHandler<GetInventorySummaryQuery, Result<InventorySummaryDto>>
{
    public async Task<Result<InventorySummaryDto>> Handle(GetInventorySummaryQuery request, CancellationToken cancellationToken)
    {
        var parents = context.Products.AsNoTracking().Where(p => p.IsActive && !p.IsDeleted);
        var variants = context.ProductVariants.AsNoTracking().Where(v => v.IsActive && !v.IsDeleted && v.Product.IsActive && !v.Product.IsDeleted);
        var value = (await parents.SumAsync(p => (decimal?)(p.Price * p.StockQuantity), cancellationToken) ?? 0m) +
            (await variants.SumAsync(v => (decimal?)(v.Price * v.StockQuantity), cancellationToken) ?? 0m);
        var lowStock = parents.Where(p => p.StockQuantity <= 5)
            .Select(p => new { p.Id, p.Name, p.SKU, p.StockQuantity, ProductVariantId = (Guid?)null })
            .Concat(variants.Where(v => v.StockQuantity <= 5)
                .Select(v => new { Id = v.ProductId, Name = v.Product.Name, v.SKU, v.StockQuantity, ProductVariantId = (Guid?)v.Id }));
        var count = await lowStock.CountAsync(cancellationToken);
        var items = await lowStock.OrderBy(p => p.StockQuantity).ThenBy(p => p.Id).ThenBy(p => p.ProductVariantId).Take(50)
            .Select(p => new LowStockProductDto(p.Id, p.Name, p.SKU, p.StockQuantity, p.ProductVariantId)).ToListAsync(cancellationToken);
        return Result<InventorySummaryDto>.Success(new InventorySummaryDto(value, count, items));
    }
}
