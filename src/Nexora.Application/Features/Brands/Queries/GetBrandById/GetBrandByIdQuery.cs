using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Brands.Queries.GetBrandById;

public sealed record GetBrandByIdQuery(Guid Id) : IRequest<Result<BrandDto>>;
