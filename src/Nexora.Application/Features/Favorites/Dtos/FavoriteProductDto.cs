namespace Nexora.Application.Features.Favorites.Dtos;

public sealed record FavoriteProductDto
(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string ProductSKU,
    decimal ProductPrice,
    string? ProductMainImageUrl,
    DateTime AddedAtUtc
);