using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Brands.Dtos;

namespace Nexora.Application.Features.Brands.Queries.GetBrandById;

public sealed record GetBrandByIdQuery(Guid Id) : IRequest<Result<BrandDto>>;
