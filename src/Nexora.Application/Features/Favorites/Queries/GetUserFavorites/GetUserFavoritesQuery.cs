using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Favorites.Dtos;

namespace Nexora.Application.Features.Favorites.Queries.GetUserFavorites;

public sealed record GetUserFavoritesQuery(
    Guid UserId,
    int Page = 1,
    int PageSize = 20) : IRequest<Result<PagedResult<FavoriteProductDto>>>;
