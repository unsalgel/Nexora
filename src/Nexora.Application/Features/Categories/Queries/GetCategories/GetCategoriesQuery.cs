using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Categories.Dtos;

namespace Nexora.Application.Features.Categories.Queries.GetCategories;

public sealed record GetCategoriesQuery(bool? IsActive = null) : IRequest<Result<List<CategoryDto>>>;
