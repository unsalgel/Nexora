using FluentAssertions;
using Iyzipay.Model;
using Nexora.Infrastructure.Payments;
using Nexora.Infrastructure.Payments.Adapters;

namespace Nexora.UnitTests.Features.Payments;

public sealed class IyzicoAdapterTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("invalid")]
    [InlineData("0")]
    [InlineData("-1")]
    [InlineData("1,000")]
    public void InvalidAmountNeverBecomesSuccessfulPayment(string? amount)
    {
        var result = IyzicoPaymentAdapter.MapVerification(new CheckoutForm
        {
            Status = "success", PaymentStatus = "SUCCESS", PaidPrice = amount,
            BasketId = "basket", PaymentId = "payment", FraudStatus = 1, Currency = "TRY"
        });
        result.IsSuccess.Should().BeFalse();
        result.IsDefinitiveFailure.Should().BeFalse();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(1)]
    public void SuccessfulRetrievalPreservesFraudAndCurrency(int fraud)
    {
        var result = IyzicoPaymentAdapter.MapVerification(new CheckoutForm
        {
            Status = "success", PaymentStatus = "SUCCESS", PaidPrice = "100.20",
            BasketId = "basket", PaymentId = "payment", FraudStatus = fraud, Currency = "TRY"
        });
        result.IsSuccess.Should().BeTrue();
        result.FraudStatus.Should().Be(fraud);
        result.Currency.Should().Be("TRY");
        result.PaidAmount.Should().Be(100.20m);
    }

    [Fact]
    public void TransportOrApiErrorIsNotBankRejection()
    {
        var unknown = IyzicoPaymentAdapter.MapVerification(new CheckoutForm { Status = "failure", ErrorCode = "500" });
        unknown.IsDefinitiveFailure.Should().BeFalse();
        var failed = IyzicoPaymentAdapter.MapVerification(new CheckoutForm { Status = "success", PaymentStatus = "FAILURE", BasketId = "basket" });
        failed.IsDefinitiveFailure.Should().BeTrue();
    }

    [Theory]
    [InlineData("https://sandbox-cpp.iyzipay.com/checkout", true)]
    [InlineData("https://cpp.iyzipay.com/checkout", true)]
    [InlineData("https://sandbox-api.iyzipay.com/checkout", true)]
    [InlineData("https://iyzipay.com.evil.example/checkout", false)]
    [InlineData("https://evil.example@cpp.iyzipay.com/checkout", false)]
    [InlineData("http://cpp.iyzipay.com/checkout", false)]
    [InlineData("javascript:alert(1)", false)]
    public void HostedUrlMustBeTrusted(string url, bool allowed) => IyzicoSettings.IsTrustedPaymentPage(url).Should().Be(allowed);

    [Theory]
    [InlineData("https://shop.example/api/v1/payments/callback", false, true)]
    [InlineData("http://localhost:5285/api/v1/payments/callback", true, true)]
    [InlineData("http://localhost:5285/api/v1/payments/callback", false, false)]
    [InlineData("https://shop.example/api/payments/iyzico-callback", false, false)]
    public void CallbackConfigurationChecksRouteAndTransport(string url, bool development, bool allowed) =>
        IyzicoSettings.IsValidCallback(url, development).Should().Be(allowed);
}
