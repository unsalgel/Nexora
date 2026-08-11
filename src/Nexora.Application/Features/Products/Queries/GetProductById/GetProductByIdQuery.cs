using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Products.Dtos;

namespace Nexora.Application.Features.Products.Queries.GetProductById;

public sealed record GetProductByIdQuery(Guid Id) : IRequest<Result<ProductDto>>;
