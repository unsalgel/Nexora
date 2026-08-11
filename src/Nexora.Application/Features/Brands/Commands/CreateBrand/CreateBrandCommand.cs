using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Brands.Commands.CreateBrand;

public sealed record CreateBrandCommand(
    string Name,
    string? LogoUrl) : IRequest<Result<Guid>>;
