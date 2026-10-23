using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using DomainEntities = Nexora.Domain.Entities;
using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Orders.Commands.UpdateOrderStatus;

public sealed class UpdateOrderStatusCommandHandler : IRequestHandler<UpdateOrderStatusCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;
    private readonly IRealTimeNotificationService _notificationService;
    private readonly IEmailService _emailService;
    private readonly ILogger<UpdateOrderStatusCommandHandler> _logger;

    public UpdateOrderStatusCommandHandler(
        IApplicationDbContext context,
        IRealTimeNotificationService notificationService,
        IEmailService emailService,
        ILogger<UpdateOrderStatusCommandHandler> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<Result<string>> Handle(UpdateOrderStatusCommand request, CancellationToken cancellationToken)
    {
        await using var transaction = await _context.BeginTransactionAsync($"order:{request.OrderId}", cancellationToken);
        var query = _context.Orders.Include(o => o.User).AsQueryable();
        if (request.NewStatus == OrderStatus.Cancelled)
        {
            query = query
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .Include(o => o.Items)
                    .ThenInclude(i => i.ProductVariant);
        }

        var order = await query
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken)
            ?? throw new NotFoundException("Sipariş bulunamadı.");

        if (order.Status == request.NewStatus && string.IsNullOrWhiteSpace(request.TrackingNumber) && string.IsNullOrWhiteSpace(request.Carrier))
        {
            return Result<string>.Success($"Sipariş durumu zaten '{GetStatusTurkishText(request.NewStatus)}'.");
        }

        if (request.NewStatus == OrderStatus.Cancelled)
            order.CancelAndRestock();
        else
            order.ChangeStatus(request.NewStatus);

        if (!string.IsNullOrWhiteSpace(request.TrackingNumber))
        {
            order.TrackingNumber = request.TrackingNumber.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Carrier))
        {
            order.Carrier = request.Carrier.Trim();
        }

        var notificationMessage = $"{order.OrderNumber} numaralı siparişinizin durumu '{GetStatusTurkishText(request.NewStatus)}' olarak güncellendi.";
        if (request.NewStatus == OrderStatus.Shipped && !string.IsNullOrWhiteSpace(order.TrackingNumber))
        {
            notificationMessage += $" Kargo Firması: {order.Carrier ?? "Belirtilmedi"}, Takip No: {order.TrackingNumber}";
        }

        var notification = new DomainEntities.Notification
        {
            UserId = order.UserId,
            Title = "Sipariş Durumu Güncellendi",
            Message = notificationMessage,
            Type = NotificationType.OrderStatusUpdated,
            IsRead = false
        };

        _context.Notifications.Add(notification);
        if (order.User is not null && !string.IsNullOrWhiteSpace(order.User.Email))
        {
            var customerName = $"{order.User.FirstName} {order.User.LastName}".Trim();
            await _emailService.SendOrderStatusChangedEmailAsync(order.User.Email, customerName, order.OrderNumber,
                GetStatusTurkishText(order.Status), order.TrackingNumber, order.Carrier, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        try
        {
            await _notificationService.PublishToUserAsync(
                order.UserId,
                "OrderStatusChanged",
                new
                {
                    notificationId = notification.Id,
                    orderId = order.Id,
                    orderNumber = order.OrderNumber,
                    title = notification.Title,
                    message = notificationMessage,
                    type = "Order",
                    newStatus = order.Status.ToString(),
                    newStatusText = GetStatusTurkishText(order.Status),
                    createdAtUtc = notification.CreatedAtUtc
                },
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Sipariş durum güncelleme anlık bildirimi iletilemedi. OrderId: {OrderId}", order.Id);
        }

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
