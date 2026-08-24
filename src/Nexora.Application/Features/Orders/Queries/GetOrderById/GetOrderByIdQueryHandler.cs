using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Orders.Dtos;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Orders.Queries.GetOrderById;

public sealed class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, Result<OrderDto>>
{
    private readonly IApplicationDbContext _context;

    public GetOrderByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<OrderDto>> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken)
            ?? throw new NotFoundException("Sipariş bulunamadı.");

        if (order.UserId != request.UserId)
        {
            throw new UnauthorizedException("Bu siparişi görüntüleme yetkiniz bulunmamaktadır.");
        }

        var dto = new OrderDto(
            order.Id,
            order.OrderNumber,
            order.UserId,
            order.ShippingAddress,
            order.TotalAmount,
            order.Status.ToString(),
            order.PaymentStatus.ToString(),
            order.CreatedAtUtc,
            order.Items.Select(i => new OrderItemDto(
                i.Id,
                i.ProductId,
                i.ProductName,
                i.ProductVariantId,
                i.VariantSKU,
                i.UnitPrice,
                i.Quantity,
                i.TotalPrice)).ToList());

        return Result<OrderDto>.Success(dto);
    }
}