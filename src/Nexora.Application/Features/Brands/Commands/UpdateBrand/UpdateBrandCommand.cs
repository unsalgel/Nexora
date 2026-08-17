using MediatR;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Brands.Commands.UpdateBrand;

public sealed record UpdateBrandCommand(
    Guid Id,
    string Name,
    string? LogoUrl,
    bool IsActive) : IRequest<Result<string>>, ICacheInvalidatorRequest
{
    public string CacheKeyPrefix => "brands:";
}
