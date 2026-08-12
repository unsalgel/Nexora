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
    List<OrderItemDto> Items);
