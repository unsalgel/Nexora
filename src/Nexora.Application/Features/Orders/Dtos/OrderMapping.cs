using Nexora.Domain.Entities;

namespace Nexora.Application.Features.Orders.Dtos;

public static class OrderMapping
{
    public static OrderDto ToDto(this Order order) => new(
        order.Id, order.OrderNumber, order.UserId, order.ShippingAddress, order.TotalAmount,
        order.Status.ToString(), order.PaymentStatus.ToString(), order.CreatedAtUtc,
        order.Items.OrderBy(i => i.Id).Select(i => new OrderItemDto(i.Id, i.ProductId, i.ProductName, i.ProductVariantId,
            i.VariantSKU, i.UnitPrice, i.Quantity, i.TotalPrice)).ToList(),
        order.TrackingNumber, order.Carrier, order.Subtotal, order.DiscountAmount, order.ShippingFee, order.CouponCode);
}
