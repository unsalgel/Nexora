using MediatR;
using Nexora.Application.Common;
using Nexora.Domain.Enums;

namespace Nexora.Application.Features.Orders.Commands.UpdateOrderStatus;

public sealed record UpdateOrderStatusCommand(
    Guid OrderId,
    OrderStatus NewStatus,
    string? TrackingNumber = null,
    string? Carrier = null) : IRequest<Result<string>>;


