using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Orders.Dtos;
using Nexora.Application.Features.Payments.Dtos;
using Nexora.Domain.Entities;
using Nexora.Domain.Enums;

namespace Nexora.Application.Features.Payments.Commands.CompletePayment;

public sealed class CompletePaymentCommandHandler : IRequestHandler<CompletePaymentCommand, Result<PaymentVerificationResult>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPaymentGateway _paymentGateway;
    private readonly IEmailService _emailService;

    public CompletePaymentCommandHandler(
        IApplicationDbContext context,
        IPaymentGateway paymentGateway,
        IEmailService emailService)
    {
        _context = context;
        _paymentGateway = paymentGateway;
        _emailService = emailService;
    }

    public async Task<Result<PaymentVerificationResult>> Handle(CompletePaymentCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
            return Result<PaymentVerificationResult>.Failure("Ödeme belirteci (token) geçersiz.");

        var verifyResult = await _paymentGateway.VerifyPaymentAsync(new PaymentVerificationRequest(request.Token), cancellationToken);

        await using var transaction = await _context.BeginTransactionAsync($"userpayment:{request.Token}", cancellationToken);

        var order = await _context.Orders
            .Include(o => o.Items)
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.IdempotencyKey == request.Token || (verifyResult.OrderNumber != null && o.OrderNumber == verifyResult.OrderNumber), cancellationToken);

        if (order is null)
        {
            return Result<PaymentVerificationResult>.Failure("İlişkili sipariş kaydı bulunamadı.");
        }

        if (order.PaymentStatus == PaymentStatus.Success && order.Status == OrderStatus.Paid)
        {
            return Result<PaymentVerificationResult>.Success(verifyResult, "Sipariş ödemesi daha önce onaylanmış.");
        }

        if (!verifyResult.IsSuccess)
        {
            order.Status = OrderStatus.Cancelled;
            order.PaymentStatus = PaymentStatus.Failed;
            order.UpdatedAtUtc = DateTime.UtcNow;

            _context.Notifications.Add(new Notification
            {
                UserId = order.UserId,
                Title = "Ödeme Başarısız",
                Message = $"{order.OrderNumber} numaralı siparişinizin ödemesi banka tarafından onaylanmadı.",
                Type = NotificationType.PaymentFailed,
                IsRead = false
            });

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return Result<PaymentVerificationResult>.Failure(verifyResult.ErrorMessage ?? "Ödeme işlemi onaylanamadı.");
        }

        if (verifyResult.PaidAmount > 0 && Math.Abs(order.TotalAmount - verifyResult.PaidAmount) > 0.05m)
        {
            order.Status = OrderStatus.Cancelled;
            order.PaymentStatus = PaymentStatus.Failed;
            order.UpdatedAtUtc = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return Result<PaymentVerificationResult>.Failure("Ödenen tutar ile sipariş tutarı uyuşmuyor.");
        }

        foreach (var item in order.Items)
        {
            if (item.ProductVariantId.HasValue)
            {
                var variant = await _context.ProductVariants.FirstOrDefaultAsync(v => v.Id == item.ProductVariantId.Value, cancellationToken);
                if (variant is not null)
                {
                    variant.StockQuantity -= item.Quantity;
                }
            }
            else
            {
                var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == item.ProductId, cancellationToken);
                if (product is not null)
                {
                    product.StockQuantity -= item.Quantity;
                }
            }
        }

        if (!string.IsNullOrWhiteSpace(order.CouponCode))
        {
            var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == order.CouponCode, cancellationToken);
            if (coupon is not null)
            {
                coupon.CurrentUsageCount++;
                if (coupon.CurrentUsageCount >= coupon.TotalUsageLimit)
                {
                    coupon.IsActive = false;
                }
            }
        }

        order.Status = OrderStatus.Paid;
        order.PaymentStatus = PaymentStatus.Success;
        order.UpdatedAtUtc = DateTime.UtcNow;

        var cart = await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == order.UserId, cancellationToken);

        if (cart is not null && cart.Items.Any())
        {
            _context.CartItems.RemoveRange(cart.Items);
        }

        _context.Notifications.Add(new Notification
        {
            UserId = order.UserId,
            Title = "Siparişiniz Alındı",
            Message = $"{order.OrderNumber} numaralı siparişiniz başarıyla alındı. Ödenen Tutar: {order.TotalAmount:N2} TL",
            Type = NotificationType.OrderCreated,
            IsRead = false
        });

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        if (order.User is not null && !string.IsNullOrWhiteSpace(order.User.Email))
        {
            var userName = $"{order.User.FirstName} {order.User.LastName}".Trim();
            await _emailService.SendOrderConfirmationEmailAsync(order.ToDto(), order.User.Email, userName, cancellationToken);
        }

        return Result<PaymentVerificationResult>.Success(verifyResult, "Ödeme başarıyla doğrulandı ve sipariş onaylandı.");
    }
}
