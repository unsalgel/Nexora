using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Favorites.Dtos;

namespace Nexora.Application.Features.Favorites.Queries.GetUserFavorites;

public sealed class GetUserFavoritesQueryHandler : IRequestHandler<GetUserFavoritesQuery, Result<PagedResult<FavoriteProductDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetUserFavoritesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PagedResult<FavoriteProductDto>>> Handle(GetUserFavoritesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Favorites
            .AsNoTracking()
            .Include(f => f.Product)
                .ThenInclude(p => p.Images)
            .Where(f => f.UserId == request.UserId && f.Product.IsActive && !f.Product.IsDeleted);

        var totalCount = await query.CountAsync(cancellationToken);

        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? 20 : (request.PageSize > 100 ? 100 : request.PageSize);

        var items = await query
            .OrderByDescending(f => f.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new FavoriteProductDto(
                f.Id,
                f.ProductId,
                f.Product.Name,
                f.Product.SKU,
                f.Product.Price,
                f.Product.Images
                    .OrderByDescending(img => img.IsMain)
                    .Select(img => img.ImageUrl)
                    .FirstOrDefault(),
                f.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedResult<FavoriteProductDto>(items, page, pageSize, totalCount);

        return Result<PagedResult<FavoriteProductDto>>.Success(pagedResult);
    }
}
