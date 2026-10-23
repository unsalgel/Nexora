using System.Text.Json.Serialization;

namespace Nexora.Infrastructure.Payments;

/// <summary>
/// İyzico ödeme ağ geçidi için yapılandırma nesnesi.
/// OWASP Secret Management standartları gereği hiçbir gizli anahtar veya URL koda gömülmez;
/// tüm değerler ortam değişkenlerinden (.env / Secrets Manager) runtime esnasında yüklenir.
/// </summary>
public sealed class IyzicoSettings
{
    public const string SectionName = "PaymentSettings:Iyzico";

    [JsonIgnore]
    public string ApiKey { get; set; } = string.Empty;

    [JsonIgnore]
    public string SecretKey { get; set; } = string.Empty;

    public string BaseUrl { get; set; } = string.Empty;

    public string CallbackUrl { get; set; } = string.Empty;

    /// <summary>
    /// Hassas anahtarların Serilog veya bellek dökümlerine (dump) sızmasını kesin olarak engeller.
    /// </summary>
    public override string ToString()
    {
        var maskedApiKey = string.IsNullOrWhiteSpace(ApiKey) ? "[EMPTY]" : $"{ApiKey[..Math.Min(4, ApiKey.Length)]}****";
        return $"[IyzicoSettings: BaseUrl='{BaseUrl}', CallbackUrl='{CallbackUrl}', ApiKey='{maskedApiKey}', SecretKey='[PROTECTED]']";
    }
}
