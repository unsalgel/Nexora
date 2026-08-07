using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Categories.Queries.GetCategories;

public sealed record GetCategoriesQuery : IRequest<Result<List<CategoryDto>>>;
