using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Favorites.Queries.GetFavoriteIds;

public sealed record GetFavoriteIdsQuery(Guid UserId) : IRequest<Result<List<Guid>>>;

public sealed class GetFavoriteIdsQueryHandler(IApplicationDbContext context) : IRequestHandler<GetFavoriteIdsQuery, Result<List<Guid>>>
{
    public async Task<Result<List<Guid>>> Handle(GetFavoriteIdsQuery request, CancellationToken cancellationToken)
    {
        var ids = await context.Favorites.AsNoTracking().Where(f => f.UserId == request.UserId && !f.Product.IsDeleted)
            .OrderBy(f => f.ProductId).Select(f => f.ProductId).ToListAsync(cancellationToken);
        return Result<List<Guid>>.Success(ids);
    }
}
