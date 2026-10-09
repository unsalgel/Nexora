using System.Globalization;
using Nexora.Application.Common.Extensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Orders.Dtos;
using Nexora.Domain.Entities;
using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;
using DomainEntities = Nexora.Domain.Entities;

namespace Nexora.Application.Features.Orders.Commands.CreateOrder;

public sealed class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Result<OrderDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPaymentService _paymentService;
    private readonly IEmailService _emailService;
    private readonly IRealTimeNotificationService _notificationService;
    private readonly ILogger<CreateOrderCommandHandler> _logger;

    public CreateOrderCommandHandler(
        IApplicationDbContext context,
        IPaymentService paymentService,
        IEmailService emailService,
        IRealTimeNotificationService notificationService,
        ILogger<CreateOrderCommandHandler> logger)
    {
        _context = context;
        _paymentService = paymentService;
        _emailService = emailService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<Result<OrderDto>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var cart = await _context.Carts
            .Include(c => c.User)
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
            .Include(c => c.Items)
                .ThenInclude(i => i.ProductVariant)
            .FirstOrDefaultAsync(c => c.UserId == request.UserId, cancellationToken)
            ?? throw new NotFoundException("Kullanıcıya ait sepet bulunamadı.");

        if (!cart.User.IsActive)
        {
            throw new UnauthorizedException("Hesabınız dondurulmuştur. Sipariş oluşturamazsınız.");
        }

        if (!cart.Items.Any())
        {
            throw new ConflictException("Sepetinizde ürün bulunmamaktadır. Boş sepetle sipariş oluşturulamaz.");
        }

        var orderItems = new List<OrderItem>();
        decimal rawTotal = 0;

        foreach (var item in cart.Items)
        {
            if (item.ProductVariantId.HasValue && item.ProductVariant is not null)
            {
                if (!item.ProductVariant.IsActive || item.ProductVariant.IsDeleted)
                {
                    throw new ConflictException($"'{item.Product.Name}' ürününün seçili varyantı satışta değildir.");
                }

                if (item.ProductVariant.StockQuantity < item.Quantity)
                {
                    throw new ConflictException($"'{item.Product.Name}' varyantı için yetersiz stok! Mevcut stok: {item.ProductVariant.StockQuantity}");
                }

                var itemTotal = item.ProductVariant.Price * item.Quantity;
                rawTotal += itemTotal;

                orderItems.Add(new OrderItem
                {
                    ProductId = item.ProductId,
                    ProductName = item.Product.Name,
                    ProductVariantId = item.ProductVariantId,
                    VariantSKU = item.ProductVariant.SKU,
                    UnitPrice = item.ProductVariant.Price,
                    Quantity = item.Quantity,
                    TotalPrice = itemTotal
                });
            }
            else
            {
                if (!item.Product.IsActive || item.Product.IsDeleted)
                {
                    throw new ConflictException($"'{item.Product.Name}' ürünü satışta değildir.");
                }

                if (item.Product.StockQuantity < item.Quantity)
                {
                    throw new ConflictException($"'{item.Product.Name}' için yetersiz stok! Mevcut stok: {item.Product.StockQuantity}");
                }

                var itemTotal = item.Product.Price * item.Quantity;
                rawTotal += itemTotal;

                orderItems.Add(new OrderItem
                {
                    ProductId = item.ProductId,
                    ProductName = item.Product.Name,
                    UnitPrice = item.Product.Price,
                    Quantity = item.Quantity,
                    TotalPrice = itemTotal
                });
            }
        }

        decimal discountAmount = 0;
        Coupon? appliedCoupon = null;

        if (!string.IsNullOrWhiteSpace(request.CouponCode))
        {
            var normalizedCode = request.CouponCode.Trim().ToUpperInvariant();
            appliedCoupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code == normalizedCode && !c.IsDeleted, cancellationToken);

            if (appliedCoupon is null || !appliedCoupon.IsActive)
            {
                throw new ConflictException("Girdiğiniz kupon kodu geçersizdir veya bulunamadı.");
            }

            if (appliedCoupon.ExpirationDateUtc <= DateTime.UtcNow)
            {
                throw new ConflictException("Girdiğiniz kupon kodunun son kullanma tarihi geçmiştir.");
            }

            if (appliedCoupon.CurrentUsageCount >= appliedCoupon.TotalUsageLimit)
            {
                throw new ConflictException("Girdiğiniz kupon kodunun kullanım limiti dolmuştur.");
            }

            if (rawTotal < appliedCoupon.MinimumOrderAmount)
            {
                throw new ConflictException($"Bu kuponu kullanabilmek için sepet tutarı en az {appliedCoupon.MinimumOrderAmount:N2} TL olmalıdır.");
            }

            if (appliedCoupon.DiscountType == DiscountType.Percentage)
            {
                discountAmount = (rawTotal * appliedCoupon.DiscountValue) / 100m;
                if (appliedCoupon.MaximumDiscountAmount.HasValue && discountAmount > appliedCoupon.MaximumDiscountAmount.Value)
                {
                    discountAmount = appliedCoupon.MaximumDiscountAmount.Value;
                }
            }
            else
            {
                discountAmount = appliedCoupon.DiscountValue;
            }

            if (discountAmount > rawTotal)
            {
                discountAmount = rawTotal;
            }
        }

        // Ödeme öncesi stok durumunu doğrula (Stok yetersizse asla karttan para çekilmemeli)
        foreach (var item in cart.Items)
        {
            if (item.ProductVariantId.HasValue && item.ProductVariant is not null)
            {
                if (item.ProductVariant.StockQuantity < item.Quantity)
                {
                    throw new ConflictException($"'{item.Product.Name}' varyantı için stok yetersiz kaldı. Kalan stok: {item.ProductVariant.StockQuantity}");
                }
            }
            else
            {
                if (item.Product.StockQuantity < item.Quantity)
                {
                    throw new ConflictException($"'{item.Product.Name}' için stok yetersiz kaldı. Kalan stok: {item.Product.StockQuantity}");
                }
            }
        }

        if (appliedCoupon is not null && appliedCoupon.CurrentUsageCount >= appliedCoupon.TotalUsageLimit)
        {
            throw new ConflictException("Kupon toplam kullanım limitine ulaştığı için uygulanamadı.");
        }

        var settings = await _context.Settings
            .AsNoTracking()
            .ToDictionaryAsync(s => s.Key, s => s.Value, cancellationToken);
        var freeShippingThreshold = decimal.TryParse(settings.GetValueOrDefault("FreeShippingThreshold", "500"), NumberStyles.Any, CultureInfo.InvariantCulture, out var fst) ? fst : 500m;
        var shippingCost = decimal.TryParse(settings.GetValueOrDefault("ShippingCost", "29.90"), NumberStyles.Any, CultureInfo.InvariantCulture, out var sc) ? sc : 29.90m;
        var isFreeShipping = rawTotal >= freeShippingThreshold || rawTotal == 0;
        var shippingFee = isFreeShipping ? 0m : shippingCost;

        var grandTotal = Math.Max(0, rawTotal + shippingFee - discountAmount);
        var orderNumber = $"NX-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";

        var isPaymentSuccessful = await _paymentService.ProcessPaymentAsync(grandTotal, request.PaymentInfo, cancellationToken);

        if (!isPaymentSuccessful)
        {
            var failedOrder = new DomainEntities.Order
            {
                OrderNumber = orderNumber,
                UserId = request.UserId,
                ShippingAddress = request.ShippingAddress,
                TotalAmount = grandTotal,
                Status = OrderStatus.Cancelled,
                PaymentStatus = PaymentStatus.Failed,
                Items = orderItems
            };

            _context.Orders.Add(failedOrder);

            _context.Notifications.Add(new DomainEntities.Notification
            {
                UserId = request.UserId,
                Title = "Ödeme Başarısız",
                Message = $"{orderNumber} numaralı siparişinizin ödemesi alınamadı. Lütfen kart bilgilerinizi kontrol ediniz.",
                Type = NotificationType.PaymentFailed,
                IsRead = false
            });

            await _context.SaveChangesAsync(cancellationToken);

            throw new ConflictException("Ödeme işlemi başarısız oldu. Kart bilgilerinizi veya bakiyenizi kontrol ediniz.");
        }

        var order = new DomainEntities.Order
        {
            OrderNumber = orderNumber,
            UserId = request.UserId,
            ShippingAddress = request.ShippingAddress,
            TotalAmount = grandTotal,
            Status = OrderStatus.Paid,
            PaymentStatus = PaymentStatus.Success,
            Items = orderItems
        };

        var lowStockAlerts = new List<(Guid ProductId, string ProductName, Guid? VariantId, string? VariantSku, int RemainingStock)>();
        foreach (var item in cart.Items)
        {
            int remainingStock;
            if (item.ProductVariantId.HasValue && item.ProductVariant is not null)
            {
                item.ProductVariant.StockQuantity -= item.Quantity;
                remainingStock = item.ProductVariant.StockQuantity;
            }
            else
            {
                item.Product.StockQuantity -= item.Quantity;
                remainingStock = item.Product.StockQuantity;
            }

            if (remainingStock <= 5)
            {
                lowStockAlerts.Add((item.ProductId, item.Product.Name, item.ProductVariantId, item.ProductVariant?.SKU, remainingStock));
            }
        }

        if (appliedCoupon is not null)
        {
            appliedCoupon.CurrentUsageCount++;
            if (appliedCoupon.CurrentUsageCount >= appliedCoupon.TotalUsageLimit)
            {
                appliedCoupon.IsActive = false;
            }
        }

        _context.Orders.Add(order);
        _context.CartItems.RemoveRange(cart.Items);

        var notification = new DomainEntities.Notification
        {
            UserId = request.UserId,
            Title = "Siparişiniz Alındı",
            Message = $"{orderNumber} numaralı siparişiniz başarıyla oluşturuldu. Ödenen Tutar: {grandTotal:N2} TL",
            Type = NotificationType.OrderCreated,
            IsRead = false
        };

        _context.Notifications.Add(notification);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConflictException("Seçilen ürün veya varyantın stoku işlem sırasında tükendi. Lütfen sepetinizi kontrol ediniz.");
        }

        try
        {
            // Kullanıcıya sipariş alındı anlık bildirimini ilet
            await _notificationService.PublishToUserAsync(
                order.UserId,
                "OrderCreated",
                new
                {
                    notificationId = notification.Id,
                    orderId = order.Id,
                    orderNumber = order.OrderNumber,
                    title = notification.Title,
                    message = notification.Message,
                    type = "Order",
                    totalAmount = grandTotal,
                    createdAtUtc = notification.CreatedAtUtc
                },
                cancellationToken);

            await _notificationService.PublishToAdminsAsync(
                "ReceiveNewOrder",
                new
                {
                    orderId = order.Id,
                    orderNumber = order.OrderNumber,
                    totalAmount = grandTotal,
                    createdAtUtc = order.CreatedAtUtc
                },
                cancellationToken);

            foreach (var alert in lowStockAlerts)
            {
                await _notificationService.PublishToAdminsAsync(
                    "LowStockAlert",
                    new
                    {
                        productId = alert.ProductId,
                        productName = alert.ProductName,
                        productVariantId = alert.VariantId,
                        variantSku = alert.VariantSku,
                        remainingStock = alert.RemainingStock
                    },
                    cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Sipariş gerçek zamanlı bildirimleri iletilirken hata oluştu. OrderId: {OrderId}", order.Id);
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

        var user = cart.User;
        if (user != null && !string.IsNullOrWhiteSpace(user.Email))
        {
            var userName = $"{user.FirstName} {user.LastName}".Trim();
            _emailService.SendInBackground(
                svc => svc.SendOrderConfirmationEmailAsync(dto, user.Email, userName, CancellationToken.None),
                _logger,
                "Sipariş onay e-postası gönderilemedi. OrderId: {OrderId}",
                order.Id);
        }

        return Result<OrderDto>.Success(dto, "Siparişiniz başarıyla oluşturuldu.");
    }
}
