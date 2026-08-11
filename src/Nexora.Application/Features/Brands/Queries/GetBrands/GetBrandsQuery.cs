using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Brands.Queries.GetBrands;

public sealed record GetBrandsQuery : IRequest<Result<List<BrandDto>>>;
