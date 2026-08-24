using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Orders.Dtos;

namespace Nexora.Application.Features.Orders.Queries.GetAllOrders;

public sealed class GetAllOrdersQueryHandler : IRequestHandler<GetAllOrdersQuery, Result<PagedResult<AdminOrderDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetAllOrdersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PagedResult<AdminOrderDto>>> Handle(GetAllOrdersQuery request, CancellationToken cancellationToken)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? 20 : (request.PageSize > 100 ? 100 : request.PageSize);

        var query = _context.Orders
            .AsNoTracking();

        if (request.Status.HasValue)
        {
            query = query.Where(o => o.Status == request.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var search = request.SearchTerm.Trim().ToLower();
            query = query.Where(o =>
                o.OrderNumber.ToLower().Contains(search) ||
                o.ShippingAddress.ToLower().Contains(search) ||
                (o.User.FirstName + " " + o.User.LastName).ToLower().Contains(search) ||
                o.User.Email.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var dtos = await query
            .OrderByDescending(o => o.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new AdminOrderDto(
                o.Id,
                o.OrderNumber,
                o.UserId,
                (o.User.FirstName + " " + o.User.LastName).Trim(),
                o.User.Email,
                o.ShippingAddress,
                o.TotalAmount,
                o.Status.ToString(),
                o.PaymentStatus.ToString(),
                o.CreatedAtUtc,
                o.Items.Sum(i => i.Quantity),
                o.Items.Select(i => new OrderItemDto(
                    i.Id,
                    i.ProductId,
                    i.ProductName,
                    i.ProductVariantId,
                    i.VariantSKU,
                    i.UnitPrice,
                    i.Quantity,
                    i.TotalPrice)).ToList()
            ))
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedResult<AdminOrderDto>(dtos, page, pageSize, totalCount);

        return Result<PagedResult<AdminOrderDto>>.Success(pagedResult);
    }
}
