using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Nexora.Application.Abstractions;

namespace Nexora.Infrastructure.Authentication;

public sealed class AuthTokenProtector(IOptions<JwtSettings> settings) : IAuthTokenProtector
{
    // OTP anahtarı zorunlu JWT anahtarından ayrı amaç etiketiyle türetilir.
    // JWT anahtarı değiştiğinde bekleyen OTP ve access token değerleri de geçersiz olur.
    private readonly byte[] _otpKey = HMACSHA256.HashData(
        Encoding.UTF8.GetBytes(settings.Value.SecretKey), Encoding.UTF8.GetBytes("Nexora/OTP/v1"));

    public string HashRefreshToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    public string HashCode(Guid userId, string purpose, string code) =>
        Convert.ToHexString(HMACSHA256.HashData(_otpKey, Encoding.UTF8.GetBytes($"{userId:N}:{purpose}:{code.Trim()}")));
    public bool VerifyCode(Guid userId, string purpose, string code, string hash)
    {
        var actual = Encoding.UTF8.GetBytes(HashCode(userId, purpose, code));
        return CryptographicOperations.FixedTimeEquals(actual, Encoding.UTF8.GetBytes(hash));
    }
}
