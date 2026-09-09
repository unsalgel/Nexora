using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Orders.Dtos;

namespace Nexora.Application.Features.Orders.Queries.GetUserOrders;

public sealed class GetUserOrdersQueryHandler : IRequestHandler<GetUserOrdersQuery, Result<PagedResult<OrderDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetUserOrdersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PagedResult<OrderDto>>> Handle(GetUserOrdersQuery request, CancellationToken cancellationToken)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? 20 : (request.PageSize > 100 ? 100 : request.PageSize);

        var query = _context.Orders
            .AsNoTracking()
            .Where(o => o.UserId == request.UserId);

        var totalCount = await query.CountAsync(cancellationToken);

        var dtos = await query
            .OrderByDescending(o => o.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new OrderDto(
                o.Id,
                o.OrderNumber,
                o.UserId,
                o.ShippingAddress,
                o.TotalAmount,
                o.Status.ToString(),
                o.PaymentStatus.ToString(),
                o.CreatedAtUtc,
                o.Items.Select(i => new OrderItemDto(
                    i.Id,
                    i.ProductId,
                    i.ProductName,
                    i.ProductVariantId,
                    i.VariantSKU,
                    i.UnitPrice,
                    i.Quantity,
                    i.TotalPrice)).ToList(),
                o.TrackingNumber,
                o.Carrier
            ))
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedResult<OrderDto>(dtos, page, pageSize, totalCount);

        return Result<PagedResult<OrderDto>>.Success(pagedResult);
    }
}

