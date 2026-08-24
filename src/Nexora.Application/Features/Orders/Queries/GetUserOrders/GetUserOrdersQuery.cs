using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Orders.Dtos;

namespace Nexora.Application.Features.Orders.Queries.GetUserOrders;

public sealed record GetUserOrdersQuery(
    Guid UserId,
    int Page = 1,
    int PageSize = 20) : IRequest<Result<PagedResult<OrderDto>>>;

