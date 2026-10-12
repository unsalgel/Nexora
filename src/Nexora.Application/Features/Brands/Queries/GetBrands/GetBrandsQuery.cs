using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Brands.Dtos;

namespace Nexora.Application.Features.Brands.Queries.GetBrands;

public sealed record GetBrandsQuery(bool? IsActive = null) : IRequest<Result<List<BrandDto>>>;
