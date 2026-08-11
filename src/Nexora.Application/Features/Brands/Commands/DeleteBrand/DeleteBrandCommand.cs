using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Brands.Commands.DeleteBrand;

public sealed record DeleteBrandCommand(Guid Id) : IRequest<Result<string>>;
