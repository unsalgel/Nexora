using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Cart.Commands.RemoveItemFromCart;

public sealed record RemoveItemFromCartCommand(
    Guid UserId,
    Guid CartItemId) : IRequest<Result<string>>;
