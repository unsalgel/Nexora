using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Categories.Queries.GetCategoryById;

public sealed record GetCategoryByIdQuery(Guid Id) : IRequest<Result<CategoryDto>>;
