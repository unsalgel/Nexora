using MediatR;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Categories.Commands.CreateCategory;

public sealed record CreateCategoryCommand(
    string Name,
    string? Description,
    Guid? ParentCategoryId) : IRequest<Result<Guid>>, ICacheInvalidatorRequest
{
    public string CacheKeyPrefix => "categories:";
}
