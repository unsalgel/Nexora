using Nexora.Domain.Enums;

namespace Nexora.Domain.Entities;

public sealed class Order : BaseEntity
{
    public string OrderNumber { get; set; } = default!;

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public string ShippingAddress { get; set; } = default!;
    public decimal TotalAmount { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

    // Kargo Takip Bilgileri
    public string? TrackingNumber { get; set; }
    public string? Carrier { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
