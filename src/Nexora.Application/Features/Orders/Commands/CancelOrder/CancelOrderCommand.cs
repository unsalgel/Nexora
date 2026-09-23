using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Orders.Commands.CancelOrder;

public sealed record CancelOrderCommand(Guid OrderId, Guid UserId) : IRequest<Result<string>>;
