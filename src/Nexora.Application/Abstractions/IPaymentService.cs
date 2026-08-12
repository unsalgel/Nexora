using Nexora.Application.Features.Orders.Dtos;

namespace Nexora.Application.Abstractions;

public interface IPaymentService
{
    Task<bool> ProcessPaymentAsync(decimal amount, PaymentRequestDto paymentInfo, CancellationToken cancellationToken = default);
}
