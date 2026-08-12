using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Orders.Commands.CreateOrder;
using Nexora.Application.Features.Orders.Commands.UpdateOrderStatus;
using Nexora.Application.Features.Orders.Dtos;
using Nexora.Application.Features.Orders.Queries.GetOrderById;
using Nexora.Application.Features.Orders.Queries.GetUserOrders;

namespace Nexora.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class OrdersController : ControllerBase
{
    private readonly ISender _sender;

    public OrdersController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPost]
    public async Task<ActionResult<Result<OrderDto>>> CreateOrder(
        CreateOrderCommand command,
        CancellationToken cancellationToken)
    {
        var safeCommand = command with { UserId = GetCurrentUserId() };
        var result = await _sender.Send(safeCommand, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpGet]
    public async Task<ActionResult<Result<PagedResult<OrderDto>>>> GetUserOrders(
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var query = new GetUserOrdersQuery(userId, page, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Result<OrderDto>>> GetOrderById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var query = new GetOrderByIdQuery(id, userId);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> UpdateOrderStatus(
        Guid id,
        UpdateOrderStatusCommand command,
        CancellationToken cancellationToken)
    {
        var safeCommand = command with { OrderId = id };
        var result = await _sender.Send(safeCommand, cancellationToken);
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
