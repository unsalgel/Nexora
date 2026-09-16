namespace Nexora.Application.Abstractions;

public interface IDbLogger
{
    Task LogErrorAsync(string source, Exception ex, string? endpoint = null, string? userEmail = null, string? clientIp = null, CancellationToken cancellationToken = default);
    Task LogWarningAsync(string source, string message, long durationMs, string? endpoint = null, string? userEmail = null, string? clientIp = null, CancellationToken cancellationToken = default);
}
