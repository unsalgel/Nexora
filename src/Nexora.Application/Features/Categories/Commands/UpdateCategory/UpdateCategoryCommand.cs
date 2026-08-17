using MediatR;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Categories.Commands.UpdateCategory;

public sealed record UpdateCategoryCommand(
    Guid Id,
    string Name,
    string? Description,
    Guid? ParentCategoryId,
    bool IsActive) : IRequest<Result<string>>, ICacheInvalidatorRequest
{
    public string CacheKeyPrefix => "categories:";
}
