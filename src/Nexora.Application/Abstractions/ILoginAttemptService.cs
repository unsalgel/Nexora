using Nexora.Application.Features.Auth.Dtos;

namespace Nexora.Application.Abstractions;

public interface ILoginAttemptService
{
    Task CheckAttemptAsync(string email, CancellationToken cancellationToken = default);
    Task RecordFailedAttemptAsync(string email, string? ipAddress, CancellationToken cancellationToken = default);
    Task<List<FailedLoginAttemptDto>> ResetAndGetAttemptsAsync(string email, CancellationToken cancellationToken = default);
}
