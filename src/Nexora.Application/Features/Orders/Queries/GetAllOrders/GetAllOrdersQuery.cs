using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Orders.Dtos;
using Nexora.Domain.Enums;

namespace Nexora.Application.Features.Orders.Queries.GetAllOrders;

public sealed record GetAllOrdersQuery(
    int Page = 1,
    int PageSize = 20,
    OrderStatus? Status = null,
    string? SearchTerm = null) : IRequest<Result<PagedResult<AdminOrderDto>>>;
