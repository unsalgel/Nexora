namespace Nexora.Application.Abstractions;

public interface ILoginAttemptService
{
    Task CheckAttemptAsync(string email, CancellationToken cancellationToken = default);
    Task RecordFailedAttemptAsync(string email, CancellationToken cancellationToken = default);
    Task ResetAttemptsAsync(string email, CancellationToken cancellationToken = default);
}
