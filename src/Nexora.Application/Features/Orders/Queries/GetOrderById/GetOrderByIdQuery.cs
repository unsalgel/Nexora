using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Orders.Dtos;

namespace Nexora.Application.Features.Orders.Queries.GetOrderById;

public sealed record GetOrderByIdQuery(
    Guid OrderId,
    Guid UserId) : IRequest<Result<OrderDto>>;

