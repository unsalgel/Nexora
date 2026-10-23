using Nexora.Application.Features.Payments.Dtos;

namespace Nexora.Application.Abstractions;

public interface IPaymentGateway
{
    Task<PaymentInitializationResult> InitializePaymentAsync(PaymentInitializationRequest request, CancellationToken cancellationToken = default);
    Task<PaymentVerificationResult> VerifyPaymentAsync(PaymentVerificationRequest request, CancellationToken cancellationToken = default);
}
