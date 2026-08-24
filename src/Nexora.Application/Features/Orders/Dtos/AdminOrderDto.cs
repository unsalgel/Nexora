namespace Nexora.Application.Features.Orders.Dtos;

public sealed record AdminOrderDto(
    Guid Id,
    string OrderNumber,
    Guid UserId,
    string CustomerFullName,
    string CustomerEmail,
    string ShippingAddress,
    decimal TotalAmount,
    string Status,
    string PaymentStatus,
    DateTime CreatedAtUtc,
    int TotalItemCount,
    List<OrderItemDto> Items);
