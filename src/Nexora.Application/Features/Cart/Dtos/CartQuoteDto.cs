namespace Nexora.Application.Features.Cart.Dtos;

public sealed record CartQuoteItemDto(Guid CartItemId, int Quantity, decimal UnitPrice, decimal TotalPrice);
public sealed record CartQuoteDto(decimal Subtotal, decimal ShippingFee, decimal DiscountAmount, decimal TotalAmount, string? CouponCode,
    List<CartQuoteItemDto>? Items = null);
