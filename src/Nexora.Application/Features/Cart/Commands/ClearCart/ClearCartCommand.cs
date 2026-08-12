using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Cart.Commands.ClearCart;

public sealed record ClearCartCommand(Guid UserId) : IRequest<Result<string>>;
