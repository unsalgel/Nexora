namespace Nexora.Application.Features.Orders.Dtos;

public sealed record OrderDto(
    Guid Id,
    string OrderNumber,
    Guid UserId,
    string ShippingAddress,
    decimal TotalAmount,
    string Status,
    string PaymentStatus,
    DateTime CreatedAtUtc,
    List<OrderItemDto> Items,
    string? TrackingNumber = null,
    string? Carrier = null,
    decimal? Subtotal = null,
    decimal? DiscountAmount = null,
    decimal? ShippingFee = null,
    string? CouponCode = null);


