using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Categories.Commands.DeleteCategory;

public sealed record DeleteCategoryCommand(Guid Id) : IRequest<Result<string>>;
