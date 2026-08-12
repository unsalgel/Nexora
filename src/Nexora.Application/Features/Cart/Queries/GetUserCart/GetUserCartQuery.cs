using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Cart.Dtos;

namespace Nexora.Application.Features.Cart.Queries.GetUserCart;

public sealed record GetUserCartQuery(Guid UserId) : IRequest<Result<CartDto>>;
