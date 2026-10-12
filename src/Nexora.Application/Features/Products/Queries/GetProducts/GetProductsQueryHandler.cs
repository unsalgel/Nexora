using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Products.Dtos;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Products.Queries.GetProducts;

public sealed class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, Result<PagedResult<ProductListDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetProductsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PagedResult<ProductListDto>>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Products
            .AsNoTracking()
            .Where(p => !p.IsDeleted);

        if (request.IsActive.HasValue)
        {
            query = query.Where(p => p.IsActive == request.IsActive.Value);
        }

        if (request.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == request.CategoryId.Value);

        if (request.BrandId.HasValue)
            query = query.Where(p => p.BrandId == request.BrandId.Value);

        if (request.MinPrice < 0 || request.MaxPrice < 0 || request.MinPrice > request.MaxPrice)
            throw new BusinessValidationException("Fiyat aralığı geçersizdir.");
        if (request.MinPrice.HasValue) query = query.Where(p => p.Price >= request.MinPrice.Value);
        if (request.MaxPrice.HasValue) query = query.Where(p => p.Price <= request.MaxPrice.Value);
        if (!string.IsNullOrWhiteSpace(request.Ids))
        {
            var values = request.Ids.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            if (values.Length > 100 || values.Any(x => !Guid.TryParse(x, out _)))
                throw new BusinessValidationException("En fazla 100 geçerli ürün kimliği gönderilebilir.");
            var ids = values.Select(Guid.Parse).Distinct().ToArray();
            query = query.Where(p => ids.Contains(p.Id));
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLowerInvariant();
            if (term.Length > 200) throw new BusinessValidationException("Arama metni 200 karakteri aşamaz.");
            var pattern = "%" + term.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_") + "%";
            query = query.Where(p => EF.Functions.Like(p.Name.ToLower(), pattern, "\\") || EF.Functions.Like(p.SKU.ToLower(), pattern, "\\"));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var page = request.Page;
        var pageSize = request.PageSize;
        var offset = Pagination.Offset(page, pageSize);

        var sorted = request.SortBy switch
        {
            "featured" => query.OrderByDescending(p => p.CreatedAtUtc).ThenBy(p => p.Id),
            "price-asc" => query.OrderBy(p => p.Price).ThenBy(p => p.Id),
            "price-desc" => query.OrderByDescending(p => p.Price).ThenBy(p => p.Id),
            _ => throw new BusinessValidationException("Geçersiz sıralama seçimi.")
        };
        var items = await sorted
            .Skip(offset)
            .Take(pageSize)
            .Select(p => new ProductListDto(
                p.Id,
                p.Name,
                p.SKU,
                p.Price,
                p.StockQuantity,
                p.Category.Name,
                p.Brand.Name,
                p.Images
                    .OrderByDescending(i => i.IsMain)
                    .Select(i => i.ImageUrl)
                    .FirstOrDefault(),
                p.IsActive,
                _context.Reviews.Where(r => r.ProductId == p.Id).Average(r => (double?)r.Rating) ?? 0,
                _context.Reviews.Count(r => r.ProductId == p.Id)))
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedResult<ProductListDto>(items, page, pageSize, totalCount);

        return Result<PagedResult<ProductListDto>>.Success(pagedResult);
    }
}
