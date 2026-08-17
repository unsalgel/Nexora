using MediatR;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Categories.Commands.DeleteCategory;

public sealed record DeleteCategoryCommand(Guid Id) : IRequest<Result<string>>, ICacheInvalidatorRequest
{
    public string CacheKeyPrefix => "categories:";
}
