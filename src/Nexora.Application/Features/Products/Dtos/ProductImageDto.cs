namespace Nexora.Application.Features.Products.Dtos;

public sealed record ProductImageDto(
    Guid Id,
    string ImageUrl,
    bool IsMain,
    int DisplayOrder);
