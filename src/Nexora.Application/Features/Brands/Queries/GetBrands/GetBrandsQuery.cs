using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Brands.Dtos;

namespace Nexora.Application.Features.Brands.Queries.GetBrands;

public sealed record GetBrandsQuery : IRequest<Result<List<BrandDto>>>;
