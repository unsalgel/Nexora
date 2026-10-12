using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Entities;
using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Orders.Commands.CancelOrder;

public sealed class CancelOrderCommandHandler : IRequestHandler<CancelOrderCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;
    private readonly IRealTimeNotificationService _notificationService;
    private readonly IEmailService _emailService;
    private readonly ILogger<CancelOrderCommandHandler> _logger;

    public CancelOrderCommandHandler(
        IApplicationDbContext context,
        IRealTimeNotificationService notificationService,
        IEmailService emailService,
        ILogger<CancelOrderCommandHandler> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<Result<string>> Handle(CancelOrderCommand request, CancellationToken cancellationToken)
    {
        await using var transaction = await _context.BeginTransactionAsync($"order:{request.OrderId}", cancellationToken);
        var order = await _context.Orders
            .Include(o => o.User)
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Include(o => o.Items)
                .ThenInclude(i => i.ProductVariant)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId && o.UserId == request.UserId, cancellationToken)
            ?? throw new NotFoundException("İptal edilecek sipariş bulunamadı.");

        if (order.Status == OrderStatus.Cancelled)
        {
            throw new ConflictException("Bu sipariş zaten iptal edilmiştir.");
        }

        if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Paid)
        {
            throw new ConflictException("Hazırlanmakta olan veya kargoya verilmiş siparişler iptal edilemez. Lütfen müşteri hizmetleri ile iletişime geçiniz.");
        }

        order.CancelAndRestock(PaymentStatus.Failed);

        var notification = new Notification
        {
            UserId = order.UserId,
            Title = "Sipariş İptal Edildi",
            Message = $"{order.OrderNumber} numaralı siparişiniz talebiniz üzerine iptal edilmiştir.",
            Type = NotificationType.OrderStatusUpdated,
            IsRead = false
        };

        _context.Notifications.Add(notification);
        if (order.User is not null && !string.IsNullOrWhiteSpace(order.User.Email))
        {
            var customerName = $"{order.User.FirstName} {order.User.LastName}".Trim();
            await _emailService.SendOrderStatusChangedEmailAsync(order.User.Email, customerName, order.OrderNumber,
                "İptal Edildi", null, null, cancellationToken);
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
                    message = notification.Message,
                    type = "Order",
                    newStatus = OrderStatus.Cancelled.ToString(),
                    newStatusText = "İptal Edildi",
                    createdAtUtc = notification.CreatedAtUtc
                },
                cancellationToken);

            }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Sipariş iptal anlık bildirimi iletilemedi. OrderId: {OrderId}", order.Id);
        }

        return Result<string>.Success("Siparişiniz başarıyla iptal edildi.");
    }
}
