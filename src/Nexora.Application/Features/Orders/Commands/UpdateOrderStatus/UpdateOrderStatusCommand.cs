using MediatR;
using Nexora.Application.Common;
using Nexora.Domain.Enums;

namespace Nexora.Application.Features.Orders.Commands.UpdateOrderStatus;

public sealed record UpdateOrderStatusCommand(
    Guid OrderId,
    OrderStatus NewStatus) : IRequest<Result<string>>;

