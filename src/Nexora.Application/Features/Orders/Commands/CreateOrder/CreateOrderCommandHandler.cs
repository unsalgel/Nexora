using MediatR;
using Microsoft.EntityFrameworkCore;
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

    public CreateOrderCommandHandler(IApplicationDbContext context, IPaymentService paymentService)
    {
        _context = context;
        _paymentService = paymentService;
    }

    public async Task<Result<OrderDto>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var cart = await _context.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
            .Include(c => c.Items)
                .ThenInclude(i => i.ProductVariant)
            .FirstOrDefaultAsync(c => c.UserId == request.UserId, cancellationToken)
            ?? throw new NotFoundException("Kullanıcıya ait sepet bulunamadı.");

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

            if (appliedCoupon is not null && appliedCoupon.IsActive && appliedCoupon.ExpirationDateUtc > DateTime.UtcNow && appliedCoupon.CurrentUsageCount < appliedCoupon.TotalUsageLimit && rawTotal >= appliedCoupon.MinimumOrderAmount)
            {
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

                appliedCoupon.CurrentUsageCount++;
                if (appliedCoupon.CurrentUsageCount >= appliedCoupon.TotalUsageLimit)
                {
                    appliedCoupon.IsActive = false;
                }
            }
        }

        var grandTotal = Math.Max(0, rawTotal - discountAmount);
        var orderNumber = $"NX-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}";

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

        foreach (var item in cart.Items)
        {
            if (item.ProductVariantId.HasValue && item.ProductVariant is not null)
            {
                item.ProductVariant.StockQuantity -= item.Quantity;
            }
            else
            {
                item.Product.StockQuantity -= item.Quantity;
            }
        }

        _context.Orders.Add(order);
        _context.CartItems.RemoveRange(cart.Items);

        _context.Notifications.Add(new DomainEntities.Notification
        {
            UserId = request.UserId,
            Title = "Siparişiniz Alındı",
            Message = $"{orderNumber} numaralı siparişiniz başarıyla oluşturuldu. Ödenen Tutar: {grandTotal:N2} TL",
            Type = NotificationType.OrderCreated,
            IsRead = false
        });

        await _context.SaveChangesAsync(cancellationToken);

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

        return Result<OrderDto>.Success(dto, "Siparişiniz başarıyla oluşturuldu.");
    }
}
