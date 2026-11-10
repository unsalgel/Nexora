using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Payments.Dtos;

namespace Nexora.Application.Features.Payments.Commands.InitializePayment;

public sealed record InitializePaymentCommand(
    string ShippingAddress,
    string? BillingAddress = null,
    string? CouponCode = null,
    decimal? ExpectedTotalAmount = null,
    string? IdempotencyKey = null,
    string? ContactName = null,
    string? PhoneNumber = null,
    string? City = null,
    string? District = null,
    string? PostalCode = null) : IRequest<Result<PaymentInitializationResult>>
{
    public Guid UserId { get; init; }
    public string? IpAddress { get; init; }
}
