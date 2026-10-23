using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Payments.Dtos;

namespace Nexora.Application.Features.Payments.Commands.CompletePayment;

public sealed record CompletePaymentCommand(string Token) : IRequest<Result<PaymentVerificationResult>>;
