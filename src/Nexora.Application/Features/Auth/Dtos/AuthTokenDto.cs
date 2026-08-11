namespace Nexora.Application.Features.Auth.Dtos;

public sealed record AuthTokenDto(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAtUtc);
