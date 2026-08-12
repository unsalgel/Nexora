using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Cart.Commands.UpdateCartItemQuantity;

public sealed record UpdateCartItemQuantityCommand(
    Guid UserId,
    Guid CartItemId,
    int Quantity) : IRequest<Result<string>>;
