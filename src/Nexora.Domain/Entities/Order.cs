using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;

namespace Nexora.Domain.Entities;

public sealed class Order : BaseEntity
{
    public string OrderNumber { get; set; } = default!;

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public string ShippingAddress { get; set; } = default!;
    public decimal TotalAmount { get; set; }
    public decimal? Subtotal { get; set; }
    public decimal? DiscountAmount { get; set; }
    public decimal? ShippingFee { get; set; }
    public string? CouponCode { get; set; }
    public uint Version { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

    // Kargo Takip Bilgileri
    public string? TrackingNumber { get; set; }
    public string? Carrier { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();

    public void ChangeStatus(OrderStatus nextStatus)
    {
        if (!Enum.IsDefined(nextStatus))
            throw new BusinessValidationException("Geçersiz sipariş durumu.");
        if (Status == nextStatus) return;
        if (Status == OrderStatus.Cancelled)
            throw new ConflictException("İptal edilmiş bir siparişin durumu değiştirilemez.");
        if (Status == OrderStatus.Shipped && nextStatus is OrderStatus.Pending or OrderStatus.Paid or OrderStatus.Processing)
            throw new ConflictException("Kargoya verilmiş bir sipariş geriye dönük durumlara (Beklemede/Hazırlanıyor) alınamaz.");
        var allowed = Status switch
        {
            OrderStatus.Pending => nextStatus is OrderStatus.Paid or OrderStatus.Cancelled,
            OrderStatus.Paid => nextStatus is OrderStatus.Processing or OrderStatus.Cancelled,
            OrderStatus.Processing => nextStatus is OrderStatus.Shipped or OrderStatus.Cancelled,
            OrderStatus.Shipped => nextStatus == OrderStatus.Delivered,
            _ => false
        };
        if (!allowed)
            throw new ConflictException("Siparişin mevcut durumundan istenen duruma geçiş yapılamaz.");
        Status = nextStatus;
    }
}
