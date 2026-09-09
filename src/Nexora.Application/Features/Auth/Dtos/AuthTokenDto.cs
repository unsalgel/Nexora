namespace Nexora.Application.Features.Auth.Dtos;

public sealed record FailedLoginAttemptDto(
    DateTime AttemptedAtUtc,
    string? IpAddress);

public sealed record AuthTokenDto(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAtUtc,
    int FailedLoginAttempts = 0,
    List<FailedLoginAttemptDto>? FailedAttemptDetails = null);
