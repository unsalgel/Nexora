using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Favorites.Commands.AddFavorite;
using Nexora.Application.Features.Favorites.Commands.RemoveFavorite;
using Nexora.Application.Features.Favorites.Dtos;
using Nexora.Application.Features.Favorites.Queries.GetUserFavorites;
using Nexora.Application.Features.Favorites.Queries.GetFavoriteIds;

namespace Nexora.Api.Controllers;

[Authorize]
public sealed class FavoritesController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<Result<PagedResult<FavoriteProductDto>>>> GetUserFavorites(
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var query = new GetUserFavoritesQuery(userId, page, pageSize);
        var result = await Sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{productId:guid}")]
    public async Task<ActionResult<Result<Guid>>> AddFavorite(
        Guid productId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var command = new AddFavoriteCommand(userId, productId);
        var result = await Sender.Send(command, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpGet("ids")]
    public async Task<ActionResult<Result<List<Guid>>>> GetFavoriteIds(CancellationToken cancellationToken)
    {
        return Ok(await Sender.Send(new GetFavoriteIdsQuery(GetCurrentUserId()), cancellationToken));
    }

    [HttpDelete("{productId:guid}")]
    public async Task<ActionResult<Result<string>>> RemoveFavorite(
        Guid productId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var command = new RemoveFavoriteCommand(userId, productId);
        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }
}
