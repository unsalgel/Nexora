using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using DomainEntities = Nexora.Domain.Entities;
using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Orders.Commands.UpdateOrderStatus;

public sealed class UpdateOrderStatusCommandHandler : IRequestHandler<UpdateOrderStatusCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;

    public UpdateOrderStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(UpdateOrderStatusCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Include(o => o.Items)
                .ThenInclude(i => i.ProductVariant)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken)
            ?? throw new NotFoundException("Sipariş bulunamadı.");

        var previousStatus = order.Status;
        order.Status = request.NewStatus;

        // Sipariş İptal ediliyorsa ve önceden iptal edilmemişse stokları iade et
        if (request.NewStatus == OrderStatus.Cancelled && previousStatus != OrderStatus.Cancelled)
        {
            order.PaymentStatus = PaymentStatus.Refunded;

            foreach (var item in order.Items)
            {
                if (item.ProductVariant != null)
                {
                    item.ProductVariant.StockQuantity += item.Quantity;
                }
                else if (item.Product != null)
                {
                    item.Product.StockQuantity += item.Quantity;
                }
            }
        }

        // Otomatik Sipariş Durumu Bildirimi
        _context.Notifications.Add(new DomainEntities.Notification
        {
            UserId = order.UserId,
            Title = "Sipariş Durumunuz Güncellendi",
            Message = $"{order.OrderNumber} numaralı siparişinizin durumu '{request.NewStatus}' olarak güncellenmiştir.",
            Type = NotificationType.OrderStatusUpdated,
            IsRead = false
        });

        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success($"Sipariş durumu '{request.NewStatus}' olarak güncellendi.");
    }
}
