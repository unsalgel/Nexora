using System.Globalization;
using Iyzipay;
using Iyzipay.Model;
using Iyzipay.Request;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Payments.Dtos;

namespace Nexora.Infrastructure.Payments.Adapters;

/// <summary>
/// İyzico 3D Secure ve Checkout Form altyapısı ile konuşan ödeme bağdaştırıcısı (Adapter).
/// PCI-DSS uyumluluğu gereği kart verisi tutmaz; güvenli token ve callback doğrulama akışını yönetir.
/// </summary>
public sealed class IyzicoPaymentAdapter : IPaymentGateway
{
    private readonly IyzicoSettings _settings;
    private readonly ILogger<IyzicoPaymentAdapter> _logger;
    private readonly Iyzipay.Options _options;

    public IyzicoPaymentAdapter(IOptions<IyzicoSettings> settings, ILogger<IyzicoPaymentAdapter> logger)
    {
        _settings = settings.Value;
        _logger = logger;
        _options = new Iyzipay.Options
        {
            ApiKey = _settings.ApiKey,
            SecretKey = _settings.SecretKey,
            BaseUrl = _settings.BaseUrl
        };
    }

    public async Task<PaymentInitializationResult> InitializePaymentAsync(PaymentInitializationRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(_settings.ApiKey) || string.IsNullOrWhiteSpace(_settings.SecretKey) || string.IsNullOrWhiteSpace(_settings.BaseUrl))
            {
                _logger.LogError("İyzico ödeme ağ geçidi başlatılamadı: ApiKey, SecretKey veya BaseUrl yapılandırılmamış.");
                return new PaymentInitializationResult(
                    IsSuccess: false,
                    Token: null,
                    CheckoutFormContent: null,
                    PaymentPageUrl: null,
                    ErrorMessage: "Ödeme altyapısı yapılandırması eksik.");
            }

            _logger.LogInformation("İyzico ödeme oturumu başlatılıyor. Sipariş No: {OrderNumber}, Tutar: {TotalAmount}",
                request.OrderNumber, request.TotalAmount);

            var iyziRequest = new CreateCheckoutFormInitializeRequest
            {
                Locale = Locale.TR.ToString(),
                ConversationId = request.OrderNumber,
                Price = request.TotalAmount.ToString("F2", CultureInfo.InvariantCulture),
                PaidPrice = request.TotalAmount.ToString("F2", CultureInfo.InvariantCulture),
                Currency = Currency.TRY.ToString(),
                BasketId = request.OrderNumber,
                PaymentGroup = PaymentGroup.PRODUCT.ToString(),
                EnabledInstallments = new List<int> { 1 },
                CallbackUrl = string.IsNullOrWhiteSpace(request.CallbackUrl) ? _settings.CallbackUrl : request.CallbackUrl,
                Buyer = new Buyer
                {
                    Id = request.Buyer.Id,
                    Name = SanitizeField(request.Buyer.Name, "Müşteri"),
                    Surname = SanitizeField(request.Buyer.Surname, "Müşteri"),
                    GsmNumber = SanitizePhone(request.Buyer.PhoneNumber),
                    Email = SanitizeEmail(request.Buyer.Email),
                    IdentityNumber = string.IsNullOrWhiteSpace(request.Buyer.IdentityNumber) ? "11111111111" : request.Buyer.IdentityNumber,
                    RegistrationAddress = SanitizeField(request.Buyer.RegistrationAddress, "Türkiye"),
                    Ip = string.IsNullOrWhiteSpace(request.Buyer.IpAddress) ? "127.0.0.1" : request.Buyer.IpAddress,
                    City = SanitizeField(request.Buyer.City, "Istanbul"),
                    Country = SanitizeField(request.Buyer.Country, "Turkey"),
                    ZipCode = string.IsNullOrWhiteSpace(request.Buyer.ZipCode) ? "34000" : request.Buyer.ZipCode
                },
                ShippingAddress = new Address
                {
                    ContactName = SanitizeField(request.ShippingAddress.ContactName, "Müşteri"),
                    City = SanitizeField(request.ShippingAddress.City, "Istanbul"),
                    Country = SanitizeField(request.ShippingAddress.Country, "Turkey"),
                    Description = SanitizeField(request.ShippingAddress.AddressLine, "Teslimat Adresi"),
                    ZipCode = string.IsNullOrWhiteSpace(request.ShippingAddress.ZipCode) ? "34000" : request.ShippingAddress.ZipCode
                },
                BillingAddress = new Address
                {
                    ContactName = SanitizeField(request.BillingAddress.ContactName, "Müşteri"),
                    City = SanitizeField(request.BillingAddress.City, "Istanbul"),
                    Country = SanitizeField(request.BillingAddress.Country, "Turkey"),
                    Description = SanitizeField(request.BillingAddress.AddressLine, "Fatura Adresi"),
                    ZipCode = string.IsNullOrWhiteSpace(request.BillingAddress.ZipCode) ? "34000" : request.BillingAddress.ZipCode
                },
                BasketItems = request.BasketItems.Select(item => new BasketItem
                {
                    Id = item.Id,
                    Name = SanitizeField(item.Name, "Ürün"),
                    Category1 = SanitizeField(item.Category, "Genel"),
                    ItemType = BasketItemType.PHYSICAL.ToString(),
                    Price = item.Price.ToString("F2", CultureInfo.InvariantCulture)
                }).ToList()
            };

            var checkoutFormInitialize = await CheckoutFormInitialize.Create(iyziRequest, _options)
                .WaitAsync(TimeSpan.FromSeconds(30), cancellationToken);

            if (checkoutFormInitialize.Status != "success")
            {
                _logger.LogWarning("İyzico ödeme başlatma başarısız. Sipariş: {OrderNumber}, Kod: {ErrorCode}, Hata: {ErrorMessage}",
                    request.OrderNumber, checkoutFormInitialize.ErrorCode, checkoutFormInitialize.ErrorMessage);

                return new PaymentInitializationResult(
                    IsSuccess: false,
                    Token: null,
                    CheckoutFormContent: null,
                    PaymentPageUrl: null,
                    ErrorMessage: checkoutFormInitialize.ErrorMessage ?? "Ödeme başlatılamadı.");
            }

            if (!IyzicoSettings.IsTrustedPaymentPage(checkoutFormInitialize.PaymentPageUrl))
                return new(false, null, null, null, "Ödeme sağlayıcısı güvenilir bir ödeme adresi döndürmedi.");
            _logger.LogInformation("İyzico ödeme oturumu başarıyla açıldı. Sipariş: {OrderNumber}", request.OrderNumber);

            return new PaymentInitializationResult(
                IsSuccess: true,
                Token: checkoutFormInitialize.Token,
                CheckoutFormContent: null,
                PaymentPageUrl: checkoutFormInitialize.PaymentPageUrl,
                ErrorMessage: null);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            _logger.LogError(ex, "İyzico ödeme oturumu başlatılırken beklenmeyen hata oluştu. Sipariş: {OrderNumber}",
                request.OrderNumber);

            return new PaymentInitializationResult(
                IsSuccess: false,
                Token: null,
                CheckoutFormContent: null,
                PaymentPageUrl: null,
                ErrorMessage: "Ödeme altyapısıyla iletişim kurulurken bir hata oluştu.");
        }
    }

    public async Task<PaymentVerificationResult> VerifyPaymentAsync(PaymentVerificationRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Token))
            {
                _logger.LogWarning("İyzico ödeme doğrulama isteğinde Token eksik.");
                return new PaymentVerificationResult(false, null, null, 0, "Doğrulama belirteci (Token) eksik.");
            }

            _logger.LogInformation("İyzico ödeme sonucu sorgulanıyor.");

            var retrieveRequest = new RetrieveCheckoutFormRequest
            {
                Locale = Locale.TR.ToString(),
                Token = request.Token
            };

            var checkoutForm = await CheckoutForm.Retrieve(retrieveRequest, _options)
                .WaitAsync(TimeSpan.FromSeconds(30), cancellationToken);
            return MapVerification(checkoutForm);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            _logger.LogError(ex, "İyzico ödeme doğrulaması sırasında beklenmeyen hata oluştu.");
            return new PaymentVerificationResult(false, null, null, 0, "Ödeme doğrulanırken sistemsel bir hata oluştu.");
        }
    }

    public static PaymentVerificationResult MapVerification(CheckoutForm form)
    {
        if (form.PaymentStatus == "FAILURE")
            return new(false, form.PaymentId, form.BasketId, 0, "Ödeme banka tarafından onaylanmadı.", IsDefinitiveFailure: true);
        if (form.Status != "success" || form.PaymentStatus != "SUCCESS")
            return new(false, form.PaymentId, form.BasketId, 0, "Ödeme sonucu henüz kesinleşmedi.");
        if (!decimal.TryParse(form.PaidPrice, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out var paidPrice) || paidPrice <= 0)
            return new(false, form.PaymentId, form.BasketId, 0, "Ödeme tutarı doğrulanamadı.");
        return new(true, form.PaymentId, form.BasketId, paidPrice, null,
            FraudStatus: form.FraudStatus, Currency: form.Currency);
    }

    private static string SanitizeField(string? value, string fallback)
    {
        if (string.IsNullOrWhiteSpace(value))
            return fallback;
        return value.Trim();
    }

    private static string SanitizePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return "+905555555555";

        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length == 10)
            return "+90" + digits;
        if (digits.Length == 11 && digits.StartsWith("0"))
            return "+9" + digits;
        if (digits.Length >= 10)
            return "+" + digits;

        return "+905555555555";
    }

    private static string SanitizeEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            return "musteri@nexora.com";
        return email.Trim();
    }
}
