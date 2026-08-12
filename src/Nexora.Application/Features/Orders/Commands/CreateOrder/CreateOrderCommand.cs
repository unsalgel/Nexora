using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Orders.Dtos;

namespace Nexora.Application.Features.Orders.Commands.CreateOrder;

public sealed record CreateOrderCommand(
    Guid UserId,
    string ShippingAddress,
    PaymentRequestDto PaymentInfo) : IRequest<Result<OrderDto>>;
