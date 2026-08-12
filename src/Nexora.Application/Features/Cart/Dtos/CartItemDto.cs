namespace Nexora.Application.Features.Cart.Dtos;

public sealed record CartItemDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string? ProductImageUrl,
    Guid? ProductVariantId,
    string? VariantSKU,
    List<string>? VariantAttributeValues,
    decimal UnitPrice,
    int Quantity,
    decimal TotalPrice);
