namespace Nexora.Application.Features.ProductVariants.Dtos;

public sealed record ProductVariantDto(
    Guid Id,
    Guid ProductId,
    string SKU,
    decimal Price,
    int StockQuantity,
    bool IsActive,
    List<string> AttributeValues);
