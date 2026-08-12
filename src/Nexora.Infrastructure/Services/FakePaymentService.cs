using Nexora.Application.Abstractions;
using Nexora.Application.Features.Orders.Dtos;

namespace Nexora.Infrastructure.Services;

public sealed class FakePaymentService : IPaymentService
{
    public Task<bool> ProcessPaymentAsync(decimal amount, PaymentRequestDto paymentInfo, CancellationToken cancellationToken = default)
    {
        if (amount <= 0)
            return Task.FromResult(false);

        var cleanCardNumber = paymentInfo.CardNumber.Replace(" ", "").Replace("-", "");

        // Simülasyon Kuralı: Kart numarası "0000" ile bitiyorsa veya CVV "000" ise ödeme reddedilir.
        if (cleanCardNumber.EndsWith("0000") || paymentInfo.Cvv == "000")
        {
            return Task.FromResult(false);
        }

        return Task.FromResult(true);
    }
}
