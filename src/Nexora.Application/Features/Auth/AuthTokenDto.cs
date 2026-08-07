namespace Nexora.Application.Features.Auth;

public sealed record AuthTokenDto(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAtUtc);
