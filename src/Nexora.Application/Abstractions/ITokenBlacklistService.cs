namespace Nexora.Application.Abstractions;

public interface ITokenBlacklistService
{
    Task RevokeTokenAsync(string jti, TimeSpan remainingLifetime, CancellationToken cancellationToken = default);
    Task<bool> IsTokenRevokedAsync(string jti, CancellationToken cancellationToken = default);
}
