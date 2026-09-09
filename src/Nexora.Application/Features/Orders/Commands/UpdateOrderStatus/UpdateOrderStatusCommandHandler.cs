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

        if (order.Status == OrderStatus.Cancelled)
        {
            throw new ConflictException("İptal edilmiş bir siparişin durumu değiştirilemez.");
        }

        if (order.Status == OrderStatus.Delivered)
        {
            throw new ConflictException("Teslim edilmiş bir siparişin durumu değiştirilemez.");
        }

        var oldStatus = order.Status;
        order.Status = request.NewStatus;

        if (!string.IsNullOrWhiteSpace(request.TrackingNumber))
        {
            order.TrackingNumber = request.TrackingNumber.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Carrier))
        {
            order.Carrier = request.Carrier.Trim();
        }

        if (request.NewStatus == OrderStatus.Cancelled && oldStatus != OrderStatus.Cancelled)
        {
            foreach (var item in order.Items)
            {
                if (item.ProductVariantId.HasValue && item.ProductVariant is not null)
                {
                    item.ProductVariant.StockQuantity += item.Quantity;
                }
                else if (item.Product is not null)
                {
                    item.Product.StockQuantity += item.Quantity;
                }
            }
        }

        var notificationMessage = $"{order.OrderNumber} numaralı siparişinizin durumu '{GetStatusTurkishText(request.NewStatus)}' olarak güncellendi.";
        if (request.NewStatus == OrderStatus.Shipped && !string.IsNullOrWhiteSpace(order.TrackingNumber))
        {
            notificationMessage += $" Kargo Firması: {order.Carrier ?? "Belirtilmedi"}, Takip No: {order.TrackingNumber}";
        }

        _context.Notifications.Add(new DomainEntities.Notification
        {
            UserId = order.UserId,
            Title = "Sipariş Durumu Güncellendi",
            Message = notificationMessage,
            Type = NotificationType.OrderStatusUpdated,
            IsRead = false
        });

        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success($"Sipariş durumu başarıyla '{GetStatusTurkishText(request.NewStatus)}' olarak güncellendi.");
    }

    private static string GetStatusTurkishText(OrderStatus status) => status switch
    {
        OrderStatus.Pending => "Beklemede",
        OrderStatus.Paid => "Ödendi",
        OrderStatus.Processing => "Hazırlanıyor",
        OrderStatus.Shipped => "Kargoya Verildi",
        OrderStatus.Delivered => "Teslim Edildi",
        OrderStatus.Cancelled => "İptal Edildi",
        _ => status.ToString()
    };
}