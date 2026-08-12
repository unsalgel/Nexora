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

[Authorize]
public sealed class OrdersController : ApiControllerBase
{
    [HttpPost]
    public async Task<ActionResult<Result<OrderDto>>> CreateOrder(
        CreateOrderCommand command,
        CancellationToken cancellationToken = default)
    {
        var safeCommand = command with { UserId = GetCurrentUserId() };
        var result = await Sender.Send(safeCommand, cancellationToken);
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
        var result = await Sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Result<OrderDto>>> GetOrderById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var query = new GetOrderByIdQuery(id, userId);
        var result = await Sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> UpdateOrderStatus(
        Guid id,
        UpdateOrderStatusCommand command,
        CancellationToken cancellationToken = default)
    {
        var safeCommand = command with { OrderId = id };
        var result = await Sender.Send(safeCommand, cancellationToken);
        return Ok(result);
    }
}
