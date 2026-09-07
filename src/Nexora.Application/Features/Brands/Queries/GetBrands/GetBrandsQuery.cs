using MediatR;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Brands.Dtos;

namespace Nexora.Application.Features.Brands.Queries.GetBrands;

public sealed record GetBrandsQuery(bool? IsActive = null) : IRequest<Result<List<BrandDto>>>, ICachableRequest
{
    public string CacheKey => $"brands:all:active_{IsActive?.ToString() ?? "all"}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(60);
}
