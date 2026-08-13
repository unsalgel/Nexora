using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Orders.Dtos;
using DomainEntities = Nexora.Domain.Entities;
using FluentValidation;
using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;

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
                .ThenInclude(ci => ci.Product)
            .Include(c => c.Items)
                .ThenInclude(ci => ci.ProductVariant)
            .FirstOrDefaultAsync(c => c.UserId == request.UserId, cancellationToken)
            ?? throw new NotFoundException("Sipariş verilecek aktif bir sepet bulunamadı.");

        if (cart.Items.Count == 0)
            throw new ValidationException("Sepetinizde ürün bulunmamaktadır.");

        // 1. Stok Doğrulaması
        foreach (var item in cart.Items)
        {
            var availableStock = item.ProductVariant?.StockQuantity ?? item.Product.StockQuantity;
            if (item.Quantity > availableStock)
            {
                var name = item.ProductVariant != null ? $"{item.Product.Name} ({item.ProductVariant.SKU})" : item.Product.Name;
                throw new ConflictException($"'{name}' ürünü için yeterli stok yok. Mevcut stok: {availableStock}");
            }
        }

        // 2. Toplam Tutar Hesaplama ve Sipariş Kalemlerini Hazırlama
        decimal grandTotal = 0;
        var orderItems = new List<DomainEntities.OrderItem>();

        foreach (var item in cart.Items)
        {
            var unitPrice = item.ProductVariant?.Price ?? item.Product.Price;
            var itemTotal = unitPrice * item.Quantity;
            grandTotal += itemTotal;

            orderItems.Add(new DomainEntities.OrderItem
            {
                ProductId = item.ProductId,
                ProductName = item.Product.Name,
                ProductVariantId = item.ProductVariantId,
                VariantSKU = item.ProductVariant?.SKU,
                UnitPrice = unitPrice,
                Quantity = item.Quantity,
                TotalPrice = itemTotal
            });
        }

        // 3. Sipariş Numarası Üretme (NXR-YYYYMMDD-XXXX)
        var orderNumber = $"NXR-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

        // 4. Ödeme İşlemi Simülasyonu
        var isPaymentSuccessful = await _paymentService.ProcessPaymentAsync(grandTotal, request.PaymentInfo, cancellationToken);

        if (!isPaymentSuccessful)
        {
            // Ödeme Başarısız: Siparişi 'Cancelled' ve 'Failed' olarak kaydet (Audit için), ama stok düşme ve sepeti SİLME!
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

            // Ödeme Başarısız Bildirimi
            _context.Notifications.Add(new DomainEntities.Notification
            {
                UserId = request.UserId,
                Title = "Ödeme Başarısız",
                Message = $"{orderNumber} numaralı siparişinizin ödemesi alınamadı. Lütfen kart bilgilerinizi kontrol ediniz.",
                Type = NotificationType.PaymentFailed,
                IsRead = false
            });

            await _context.SaveChangesAsync(cancellationToken);

            throw new ValidationException("Ödeme işlemi başarısız oldu. Kart bilgilerinizi veya bakiyenizi kontrol ediniz.");
        }

        // 5. Siparişi Kaydetme (Ödeme Başarılı)
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

        _context.Orders.Add(order);

        // 6. Stok Düşürme ve Sepeti Temizleme
        foreach (var item in cart.Items)
        {
            if (item.ProductVariant != null)
            {
                item.ProductVariant.StockQuantity -= item.Quantity;
            }
            else
            {
                item.Product.StockQuantity -= item.Quantity;
            }
        }

        _context.CartItems.RemoveRange(cart.Items);

        // Başarılı Sipariş Bildirimi
        _context.Notifications.Add(new DomainEntities.Notification
        {
            UserId = request.UserId,
            Title = "Siparişiniz Alındı",
            Message = $"{orderNumber} numaralı siparişiniz başarıyla oluşturuldu ve ödemesi onaylandı.",
            Type = NotificationType.OrderCreated,
            IsRead = false
        });

        await _context.SaveChangesAsync(cancellationToken);

        // 7. DTO Dönüşü
        var itemDtos = order.Items.Select(i => new OrderItemDto(
            i.Id,
            i.ProductId,
            i.ProductName,
            i.ProductVariantId,
            i.VariantSKU,
            i.UnitPrice,
            i.Quantity,
            i.TotalPrice)).ToList();

        var orderDto = new OrderDto(
            order.Id,
            order.OrderNumber,
            order.UserId,
            order.ShippingAddress,
            order.TotalAmount,
            order.Status.ToString(),
            order.PaymentStatus.ToString(),
            order.CreatedAtUtc,
            itemDtos);

        return Result<OrderDto>.Success(orderDto, "Siparişiniz başarıyla oluşturuldu ve ödemeniz alındı.");
    }
}
