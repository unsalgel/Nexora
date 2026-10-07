namespace Nexora.Application.Abstractions;

public interface ITokenBlacklistService
{
    Task RevokeTokenAsync(string jti, TimeSpan remainingLifetime, CancellationToken cancellationToken = default);
    Task<bool> IsTokenRevokedAsync(string jti, CancellationToken cancellationToken = default);
    Task RevokeUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task UnrevokeUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> IsUserRevokedAsync(Guid userId, CancellationToken cancellationToken = default);
}
