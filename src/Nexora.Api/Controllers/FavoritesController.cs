using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Favorites.Commands.AddFavorite;
using Nexora.Application.Features.Favorites.Commands.RemoveFavorite;
using Nexora.Application.Features.Favorites.Dtos;
using Nexora.Application.Features.Favorites.Queries.GetUserFavorites;

namespace Nexora.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class FavoritesController : ControllerBase
{
    private readonly ISender _sender;

    public FavoritesController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    public async Task<ActionResult<Result<PagedResult<FavoriteProductDto>>>> GetUserFavorites(
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var query = new GetUserFavoritesQuery(userId, page, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{productId:guid}")]
    public async Task<ActionResult<Result<Guid>>> AddFavorite(
        Guid productId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new AddFavoriteCommand(userId, productId);
        var result = await _sender.Send(command, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpDelete("{productId:guid}")]
    public async Task<ActionResult<Result<string>>> RemoveFavorite(
        Guid productId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new RemoveFavoriteCommand(userId, productId);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(result);
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Geçerli bir kullanıcı oturumu bulunamadı.");
        }
        return userId;
    }
}
