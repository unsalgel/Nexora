namespace Nexora.Application.Features.Brands.Dtos;

public sealed record BrandDto(
    Guid Id,
    string Name,
    string? LogoUrl,
    bool IsActive);
