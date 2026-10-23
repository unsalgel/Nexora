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

            var checkoutFormInitialize = await Task.Run(() => CheckoutFormInitialize.Create(iyziRequest, _options), cancellationToken);

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

            _logger.LogInformation("İyzico ödeme oturumu başarıyla açıldı. Sipariş: {OrderNumber}, Token: {Token}",
                request.OrderNumber, checkoutFormInitialize.Token);

            return new PaymentInitializationResult(
                IsSuccess: true,
                Token: checkoutFormInitialize.Token,
                CheckoutFormContent: checkoutFormInitialize.CheckoutFormContent,
                PaymentPageUrl: checkoutFormInitialize.PaymentPageUrl,
                ErrorMessage: null);
        }
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

            _logger.LogInformation("İyzico ödeme sonucu sorgulanıyor. Token: {Token}", request.Token);

            var retrieveRequest = new RetrieveCheckoutFormRequest
            {
                Locale = Locale.TR.ToString(),
                Token = request.Token
            };

            var checkoutForm = await Task.Run(() => CheckoutForm.Retrieve(retrieveRequest, _options), cancellationToken);

            if (checkoutForm.Status != "success" || checkoutForm.PaymentStatus != "SUCCESS")
            {
                _logger.LogWarning("İyzico ödeme doğrulaması başarısız. Token: {Token}, Durum: {PaymentStatus}, Hata: {ErrorMessage}",
                    request.Token, checkoutForm.PaymentStatus, checkoutForm.ErrorMessage);

                return new PaymentVerificationResult(
                    IsSuccess: false,
                    PaymentId: checkoutForm.PaymentId,
                    OrderNumber: checkoutForm.BasketId,
                    PaidAmount: 0,
                    ErrorMessage: checkoutForm.ErrorMessage ?? "Ödeme banka tarafından onaylanmadı.");
            }

            decimal paidPrice = 0;
            if (!string.IsNullOrWhiteSpace(checkoutForm.PaidPrice))
            {
                decimal.TryParse(checkoutForm.PaidPrice, NumberStyles.Any, CultureInfo.InvariantCulture, out paidPrice);
            }

            _logger.LogInformation("İyzico ödemesi başarıyla doğrulandı. Sipariş: {BasketId}, Ödeme ID: {PaymentId}, Tutar: {PaidPrice}",
                checkoutForm.BasketId, checkoutForm.PaymentId, paidPrice);

            return new PaymentVerificationResult(
                IsSuccess: true,
                PaymentId: checkoutForm.PaymentId,
                OrderNumber: checkoutForm.BasketId,
                PaidAmount: paidPrice,
                ErrorMessage: null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "İyzico ödeme doğrulaması sırasında beklenmeyen hata oluştu. Token: {Token}", request.Token);
            return new PaymentVerificationResult(false, null, null, 0, "Ödeme doğrulanırken sistemsel bir hata oluştu.");
        }
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
