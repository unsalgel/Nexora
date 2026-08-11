namespace Nexora.Application.Features.Brands;

public sealed record BrandDto(
    Guid Id,
    string Name,
    string? LogoUrl,
    bool IsActive);
