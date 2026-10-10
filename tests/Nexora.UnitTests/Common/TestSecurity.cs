using Microsoft.Extensions.Options;
using Nexora.Application.Abstractions;
using Nexora.Infrastructure.Authentication;

namespace Nexora.UnitTests.Common;

internal static class TestSecurity
{
    public static JwtSettings Settings { get; } = new()
    { SecretKey = "TEST-ONLY-KEY-DO-NOT-USE-IN-PRODUCTION-123456789", Issuer = "test", Audience = "test", AccessTokenExpirationMinutes = 15, RefreshTokenExpirationDays = 7 };
    public static IAuthTokenProtector Protector { get; } = new AuthTokenProtector(Options.Create(Settings));
}
