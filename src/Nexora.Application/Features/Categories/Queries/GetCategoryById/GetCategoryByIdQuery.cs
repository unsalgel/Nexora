using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Categories.Dtos;

namespace Nexora.Application.Features.Categories.Queries.GetCategoryById;

public sealed record GetCategoryByIdQuery(Guid Id) : IRequest<Result<CategoryDto>>;
