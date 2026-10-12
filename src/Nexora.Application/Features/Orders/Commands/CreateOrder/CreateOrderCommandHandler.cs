using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Orders.Dtos;
using Nexora.Application.Features.Cart;
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
    private readonly ICacheService? _cacheService;

    public CreateOrderCommandHandler(
        IApplicationDbContext context,
        IPaymentService paymentService,
        IEmailService emailService,
        IRealTimeNotificationService notificationService,
        ILogger<CreateOrderCommandHandler> logger,
        ICacheService? cacheService = null)
    {
        _context = context;
        _paymentService = paymentService;
        _emailService = emailService;
        _notificationService = notificationService;
        _logger = logger;
        _cacheService = cacheService;
    }

    public async Task<Result<OrderDto>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        string? idempotencyKey = string.IsNullOrWhiteSpace(request.IdempotencyKey) ? null : request.IdempotencyKey.Trim();
        string? cacheKey = idempotencyKey is not null ? $"idempotency:order:{request.UserId}:{idempotencyKey}" : null;

        if (cacheKey is not null && _cacheService is not null)
        {
            var cached = await _cacheService.GetAsync<OrderIdempotencyRecord>(cacheKey, cancellationToken);
            if (cached is not null)
            {
                var currentHash = ComputePayloadHash(request);
                if (cached.PayloadHash != currentHash)
                {
                    throw new ConflictException("Aynı idempotency anahtarı ile farklı parametreli bir sipariş isteği gönderilemez.");
                }

                _logger.LogInformation("Mükerrer sipariş isteği tespit edildi, önbellekteki sipariş döndürülüyor: {OrderNumber}", cached.OrderResult.OrderNumber);
                return Result<OrderDto>.Success(cached.OrderResult, "Siparişiniz başarıyla oluşturuldu.");
            }
        }

        await using var transaction = await _context.BeginTransactionAsync($"usercart:{request.UserId}", cancellationToken);
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

        var cartGroups = cart.Items.GroupBy(i => new { i.ProductId, i.ProductVariantId })
            .Select(g => new { Item = g.First(), Quantity = g.Sum(i => i.Quantity) }).ToList();
        foreach (var group in cartGroups)
        {
            var item = group.Item;
            var quantity = group.Quantity;
            if (group.Item.Product.Price <= 0 || group.Item.ProductVariant?.Price <= 0 || quantity <= 0 || !item.Product.IsActive || item.Product.IsDeleted)
                throw new ConflictException("Sepette satışa uygun olmayan ürün var.");
            if (item.ProductVariantId.HasValue && (item.ProductVariant is null || item.ProductVariant.ProductId != item.ProductId))
                throw new ConflictException("Sepette geçersiz ürün varyantı var.");
            if (item.ProductVariantId.HasValue && item.ProductVariant is not null)
            {
                if (!item.ProductVariant.IsActive || item.ProductVariant.IsDeleted)
                {
                    throw new ConflictException($"'{item.Product.Name}' ürününün seçili varyantı satışta değildir.");
                }

                if (item.ProductVariant.StockQuantity < quantity)
                {
                    throw new ConflictException($"'{item.Product.Name}' varyantı için yetersiz stok! Mevcut stok: {item.ProductVariant.StockQuantity}");
                }

                var itemTotal = item.ProductVariant.Price * quantity;
                rawTotal += itemTotal;

                orderItems.Add(new OrderItem
                {
                    ProductId = item.ProductId,
                    ProductName = item.Product.Name,
                    ProductVariantId = item.ProductVariantId,
                    VariantSKU = item.ProductVariant.SKU,
                    UnitPrice = item.ProductVariant.Price,
                    Quantity = quantity,
                    TotalPrice = itemTotal
                });
            }
            else
            {
                if (item.Product.StockQuantity < quantity)
                {
                    throw new ConflictException($"'{item.Product.Name}' için yetersiz stok! Mevcut stok: {item.Product.StockQuantity}");
                }

                var itemTotal = item.Product.Price * quantity;
                rawTotal += itemTotal;

                orderItems.Add(new OrderItem
                {
                    ProductId = item.ProductId,
                    ProductName = item.Product.Name,
                    UnitPrice = item.Product.Price,
                    Quantity = quantity,
                    TotalPrice = itemTotal
                });
            }
        }

        var pricing = await CartPricing.CalculateAsync(_context, rawTotal, request.CouponCode, cancellationToken);
        var grandTotal = pricing.Quote.TotalAmount;
        var appliedCoupon = pricing.Coupon;
        if (request.ExpectedTotalAmount.HasValue && request.ExpectedTotalAmount.Value != grandTotal)
            throw new ConflictException("Sepet toplamı değişti. Güncel tutarı kontrol edip tekrar onaylayınız.");

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
                Subtotal = pricing.Quote.Subtotal,
                DiscountAmount = pricing.Quote.DiscountAmount,
                ShippingFee = pricing.Quote.ShippingFee,
                CouponCode = pricing.Quote.CouponCode,
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
            await transaction.CommitAsync(cancellationToken);

            throw new ConflictException("Ödeme işlemi başarısız oldu. Kart bilgilerinizi veya bakiyenizi kontrol ediniz.");
        }

        var order = new DomainEntities.Order
        {
            OrderNumber = orderNumber,
            UserId = request.UserId,
            ShippingAddress = request.ShippingAddress,
            TotalAmount = grandTotal,
            Subtotal = pricing.Quote.Subtotal,
            DiscountAmount = pricing.Quote.DiscountAmount,
            ShippingFee = pricing.Quote.ShippingFee,
            CouponCode = pricing.Quote.CouponCode,
            Status = OrderStatus.Paid,
            PaymentStatus = PaymentStatus.Success,
            Items = orderItems
        };

        var lowStockAlerts = new List<(Guid ProductId, string ProductName, Guid? VariantId, string? VariantSku, int RemainingStock)>();
        foreach (var group in cartGroups)
        {
            var item = group.Item;
            var quantity = group.Quantity;
            int remainingStock;
            if (item.ProductVariantId.HasValue && item.ProductVariant is not null)
            {
                item.ProductVariant.StockQuantity -= quantity;
                remainingStock = item.ProductVariant.StockQuantity;
            }
            else
            {
                item.Product.StockQuantity -= quantity;
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

        var dto = new OrderDto(
            order.Id,
            order.OrderNumber,
            order.UserId,
            order.ShippingAddress,
            order.TotalAmount,
            order.Status.ToString(),
            order.PaymentStatus.ToString(),
            DateTime.UtcNow,
            order.Items.Select(i => new OrderItemDto(
                i.Id,
                i.ProductId,
                i.ProductName,
                i.ProductVariantId,
                i.VariantSKU,
                i.UnitPrice,
                i.Quantity,
                i.TotalPrice)).ToList(),
            Subtotal: order.Subtotal, DiscountAmount: order.DiscountAmount, ShippingFee: order.ShippingFee, CouponCode: order.CouponCode);

        var user = cart.User;
        if (user != null && !string.IsNullOrWhiteSpace(user.Email))
        {
            var userName = $"{user.FirstName} {user.LastName}".Trim();
            await _emailService.SendOrderConfirmationEmailAsync(dto, user.Email, userName, cancellationToken);
        }

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConflictException("Seçilen ürün veya varyantın stoku işlem sırasında tükendi. Lütfen sepetinizi kontrol ediniz.");
        }

        try
        {
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

        if (cacheKey is not null && _cacheService is not null)
        {
            var record = new OrderIdempotencyRecord(dto, ComputePayloadHash(request), DateTime.UtcNow);
            await _cacheService.SetAsync(cacheKey, record, TimeSpan.FromHours(24), cancellationToken);
        }

        return Result<OrderDto>.Success(dto, "Siparişiniz başarıyla oluşturuldu.");
    }

    private static string ComputePayloadHash(CreateOrderCommand request)
    {
        var cardLast4 = request.PaymentInfo?.CardNumber is { Length: >= 4 } num ? num[^4..] : string.Empty;
        var raw = $"{request.UserId:N}:{request.ShippingAddress.Trim()}:{request.CouponCode?.Trim().ToUpperInvariant()}:{request.ExpectedTotalAmount}:{cardLast4}";
        using var sha = System.Security.Cryptography.SHA256.Create();
        var bytes = sha.ComputeHash(System.Text.Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(bytes);
    }
}
