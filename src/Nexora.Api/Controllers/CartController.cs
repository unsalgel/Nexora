using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Cart.Commands.AddItemToCart;
using Nexora.Application.Features.Cart.Commands.ClearCart;
using Nexora.Application.Features.Cart.Commands.RemoveItemFromCart;
using Nexora.Application.Features.Cart.Commands.UpdateCartItemQuantity;
using Nexora.Application.Features.Cart.Dtos;
using Nexora.Application.Features.Cart.Queries.GetUserCart;

namespace Nexora.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class CartController : ControllerBase
{
    private readonly ISender _sender;

    public CartController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    public async Task<ActionResult<Result<CartDto>>> GetCart(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var query = new GetUserCartQuery(userId);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost("items")]
    public async Task<ActionResult<Result<Guid>>> AddItemToCart(
        AddItemToCartCommand command,
        CancellationToken cancellationToken)
    {
        var safeCommand = command with { UserId = GetCurrentUserId() };
        var result = await _sender.Send(safeCommand, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPut("items/{cartItemId:guid}")]
    public async Task<ActionResult<Result<string>>> UpdateCartItemQuantity(
        Guid cartItemId,
        UpdateCartItemQuantityCommand command,
        CancellationToken cancellationToken)
    {
        var safeCommand = command with { UserId = GetCurrentUserId(), CartItemId = cartItemId };
        var result = await _sender.Send(safeCommand, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("items/{cartItemId:guid}")]
    public async Task<ActionResult<Result<string>>> RemoveItemFromCart(
        Guid cartItemId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new RemoveItemFromCartCommand(userId, cartItemId);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpDelete]
    public async Task<ActionResult<Result<string>>> ClearCart(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new ClearCartCommand(userId);
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
