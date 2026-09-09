namespace Nexora.Application.Features.Products.Dtos;

public sealed record ProductDto(
    Guid Id,
    string Name,
    string SKU,
    string? Description,
    decimal Price,
    int StockQuantity,
    Guid CategoryId,
    string CategoryName,
    Guid BrandId,
    string BrandName,
    bool IsActive,
    List<ProductImageDto> Images,
    List<ProductVariantDto>? Variants = null);
