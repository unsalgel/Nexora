namespace Nexora.Application.Features.Products.Dtos;

public sealed record ProductListDto(
    Guid Id,
    string Name,
    string SKU,
    decimal Price,
    int StockQuantity,
    string CategoryName,
    string BrandName,
    string? MainImageUrl,
    bool IsActive);
