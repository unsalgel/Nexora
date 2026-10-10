namespace Nexora.Application.Abstractions;

public interface IApplicationTransaction : IAsyncDisposable
{
    Task AcquireLockAsync(string lockKey, CancellationToken cancellationToken = default);
    Task CommitAsync(CancellationToken cancellationToken = default);
}
