using MediatR;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Categories.Dtos;

namespace Nexora.Application.Features.Categories.Queries.GetCategories;

public sealed record GetCategoriesQuery(bool? IsActive = null) : IRequest<Result<List<CategoryDto>>>, ICachableRequest
{
    public string CacheKey => $"categories:all:active_{IsActive?.ToString() ?? "all"}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(60);
}
