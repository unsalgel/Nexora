using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.ProductVariants.Dtos;

namespace Nexora.Application.Features.ProductVariants.Queries.GetProductVariantsByProductId;

public sealed record GetProductVariantsByProductIdQuery(Guid ProductId, bool IncludeInactive = false) : IRequest<Result<List<ProductVariantDto>>>;
