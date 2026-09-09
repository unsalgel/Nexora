namespace Nexora.Application.Features.Products.Dtos;

public sealed record ProductVariantAttributeValueDto(
    string AttributeName,
    string AttributeValue);

public sealed record ProductVariantDto(
    Guid Id,
    string SKU,
    decimal Price,
    int StockQuantity,
    bool IsActive,
    List<ProductVariantAttributeValueDto> Attributes);
