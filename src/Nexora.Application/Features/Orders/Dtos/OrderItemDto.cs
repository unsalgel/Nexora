namespace Nexora.Application.Features.Orders.Dtos;

public sealed record OrderItemDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    Guid? ProductVariantId,
    string? VariantSKU,
    decimal UnitPrice,
    int Quantity,
    decimal TotalPrice);
