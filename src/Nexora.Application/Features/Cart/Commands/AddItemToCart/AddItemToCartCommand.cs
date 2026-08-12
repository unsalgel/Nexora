using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Cart.Commands.AddItemToCart;

public sealed record AddItemToCartCommand(
    Guid UserId,
    Guid ProductId,
    Guid? ProductVariantId,
    int Quantity = 1) : IRequest<Result<Guid>>;
