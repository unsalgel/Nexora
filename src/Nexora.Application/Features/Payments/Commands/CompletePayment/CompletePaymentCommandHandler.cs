using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Orders.Dtos;
using Nexora.Application.Features.Payments.Dtos;
using Nexora.Domain.Entities;
using Nexora.Domain.Enums;

namespace Nexora.Application.Features.Payments.Commands.CompletePayment;

public sealed class CompletePaymentCommandHandler(
    IApplicationDbContext context, IPaymentGateway paymentGateway, IEmailService emailService)
    : IRequestHandler<CompletePaymentCommand, Result<PaymentVerificationResult>>
{
    public async Task<Result<PaymentVerificationResult>> Handle(CompletePaymentCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token) || request.Token.Length > 128)
            return Result<PaymentVerificationResult>.Failure("Ödeme belirteci geçersiz.");

        var orderId = await context.Orders.AsNoTracking().Where(o => o.PaymentToken == request.Token)
            .Select(o => (Guid?)o.Id).SingleOrDefaultAsync(cancellationToken);
        if (!orderId.HasValue)
            return Result<PaymentVerificationResult>.Failure("İlişkili sipariş kaydı bulunamadı.");

        // All cancellation/status handlers use this same lock. Resolve a token only to its own order.
        await using var transaction = await context.BeginTransactionAsync($"order:{orderId}", cancellationToken);
        var order = await context.Orders.Include(o => o.User)
            .Include(o => o.Items).ThenInclude(i => i.Product)
            .Include(o => o.Items).ThenInclude(i => i.ProductVariant)
            .SingleAsync(o => o.Id == orderId, cancellationToken);

        if (order.PaymentStatus is PaymentStatus.Success or PaymentStatus.Failed or PaymentStatus.Refunded)
            return StoredResult(order);

        var verified = await paymentGateway.VerifyPaymentAsync(new(request.Token), cancellationToken);
        order.NextPaymentCheckAtUtc = DateTime.UtcNow.AddMinutes(5);

        // Even a definite failure must match the stored basket before releasing inventory.
        if (verified.OrderNumber != order.OrderNumber)
        {
            MarkUncertain(order, PaymentStatus.Unknown);
        }
        else if (verified.IsDefinitiveFailure && !verified.IsSuccess)
        {
            order.PaymentStatus = PaymentStatus.Failed;
            order.CancelAndRestock();
            await ReleaseCouponAsync(order, cancellationToken);
            order.NextPaymentCheckAtUtc = null;
            context.Notifications.Add(new Notification
            {
                UserId = order.UserId, Title = "Ödeme Başarısız",
                Message = $"{order.OrderNumber} numaralı siparişinizin ödemesi onaylanmadı.",
                Type = NotificationType.PaymentFailed
            });
        }
        else if (!verified.IsSuccess)
        {
            MarkUncertain(order, PaymentStatus.Unknown);
        }
        else if (verified.PaidAmount <= 0 || verified.PaidAmount != order.TotalAmount ||
                 verified.Currency != "TRY" || string.IsNullOrWhiteSpace(verified.PaymentId))
        {
            MarkUncertain(order, PaymentStatus.RequiresAttention);
        }
        else
        {
            order.PaymentId = verified.PaymentId;
            order.PaidAmount = verified.PaidAmount;
            order.FraudStatus = verified.FraudStatus;
            if (verified.FraudStatus != 1)
            {
                // A fraud rejection after a charge is not proof that money was returned.
                MarkUncertain(order, verified.FraudStatus == 0 ? PaymentStatus.UnderReview : PaymentStatus.RequiresAttention);
            }
            else if (order.Status != OrderStatus.Pending || !order.StockReserved)
            {
                // Includes pre-migration sessions without a reservation and late cancelled payments.
                MarkUncertain(order, PaymentStatus.RequiresAttention);
            }
            else
            {
                await transaction.AcquireLockAsync($"usercart:{order.UserId}", cancellationToken);
                if (order.ReservedCouponId.HasValue)
                {
                    var coupon = await context.Coupons.SingleAsync(c => c.Id == order.ReservedCouponId, cancellationToken);
                    if (coupon.ReservedUsageCount <= 0)
                        throw new InvalidOperationException("Ödeme kupon rezervasyonu bulunamadı.");
                    coupon.ReservedUsageCount--;
                    coupon.CurrentUsageCount++;
                    order.ReservedCouponId = null;
                }

                // Consume only original rows/quantities. New rows survive a delayed callback.
                var cart = await context.Carts.Include(c => c.Items)
                    .SingleOrDefaultAsync(c => c.UserId == order.UserId, cancellationToken);
                if (cart is not null)
                {
                    foreach (var purchased in order.Items)
                    {
                        var row = cart.Items.FirstOrDefault(i => i.Id == purchased.SourceCartItemId);
                        if (row is null) continue;
                        if (row.Quantity <= purchased.Quantity) context.CartItems.Remove(row);
                        else row.Quantity -= purchased.Quantity;
                    }
                }

                order.PaymentStatus = PaymentStatus.Success;
                order.ChangeStatus(OrderStatus.Paid);
                order.NextPaymentCheckAtUtc = null;
                context.Notifications.Add(new Notification
                {
                    UserId = order.UserId, Title = "Siparişiniz Alındı",
                    Message = $"{order.OrderNumber} numaralı siparişiniz başarıyla alındı.",
                    Type = NotificationType.OrderCreated
                });
                // IEmailService persists to the outbox in the same transaction.
                if (order.User is not null && !string.IsNullOrWhiteSpace(order.User.Email))
                    await emailService.SendOrderConfirmationEmailAsync(order.ToDto(), order.User.Email,
                        $"{order.User.FirstName} {order.User.LastName}".Trim(), cancellationToken);
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return StoredResult(order);
    }

    private async Task ReleaseCouponAsync(Order order, CancellationToken ct)
    {
        if (!order.ReservedCouponId.HasValue) return;
        var coupon = await context.Coupons.SingleAsync(c => c.Id == order.ReservedCouponId, ct);
        if (coupon.ReservedUsageCount <= 0) throw new InvalidOperationException("Kupon rezervasyonu tutarsız.");
        coupon.ReservedUsageCount--;
        order.ReservedCouponId = null;
    }

    private void MarkUncertain(Order order, PaymentStatus status)
    {
        order.PaymentStatus = DateTime.UtcNow - order.CreatedAtUtc > TimeSpan.FromHours(24)
            ? PaymentStatus.RequiresAttention : status;
        if (order.PaymentStatus != PaymentStatus.RequiresAttention || order.PaymentReviewNotified) return;
        order.PaymentReviewNotified = true;
        context.Notifications.Add(new Notification
        {
            UserId = order.UserId, Title = "Ödeme Kontrol Ediliyor",
            Message = $"{order.OrderNumber} numaralı siparişinizin ödeme sonucu inceleniyor. Lütfen tekrar ödeme yapmayınız.",
            Type = NotificationType.System
        });
    }

    private static Result<PaymentVerificationResult> StoredResult(Order order)
    {
        var success = order.PaymentStatus == PaymentStatus.Success;
        var message = success ? "Ödeme doğrulandı." : order.PaymentStatus == PaymentStatus.Failed
            ? "Ödeme onaylanmadı." : "Ödeme sonucu kontrol ediliyor. Lütfen tekrar ödeme yapmayınız.";
        return new(success, new(success, order.PaymentId, order.OrderNumber, order.PaidAmount ?? 0, success ? null : message,
            order.PaymentStatus == PaymentStatus.Failed, order.FraudStatus, "TRY"), message, null);
    }
}