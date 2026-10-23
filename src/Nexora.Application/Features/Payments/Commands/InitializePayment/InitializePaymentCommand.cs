using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Payments.Dtos;

namespace Nexora.Application.Features.Payments.Commands.InitializePayment;

public sealed record InitializePaymentCommand(
    string ShippingAddress,
    string? BillingAddress = null,
    string? CouponCode = null,
    decimal? ExpectedTotalAmount = null) : IRequest<Result<PaymentInitializationResult>>
{
    public Guid UserId { get; init; }
}
