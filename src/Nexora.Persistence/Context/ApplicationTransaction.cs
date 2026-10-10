using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Nexora.Application.Abstractions;

namespace Nexora.Persistence.Context;

internal sealed class ApplicationTransaction : IApplicationTransaction
{
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> TestLocks = new();
    private readonly NexoraDbContext _context;
    private readonly IDbContextTransaction? _transaction;
    private readonly List<SemaphoreSlim> _heldLocks = [];
    private readonly HashSet<string> _keys = [];

    public ApplicationTransaction(NexoraDbContext context, IDbContextTransaction? transaction)
    {
        _context = context;
        _transaction = transaction;
    }

    public async Task AcquireLockAsync(string lockKey, CancellationToken cancellationToken = default)
    {
        if (!_keys.Add(lockKey)) return;
        if (_transaction is not null)
        {
            var digest = SHA256.HashData(Encoding.UTF8.GetBytes("nexora-lock:" + lockKey));
            var key = System.Buffers.Binary.BinaryPrimitives.ReadInt64BigEndian(digest);
            await _context.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock({key})", cancellationToken);
        }
        else
        {
            // InMemory yalnız unit test provider'ıdır; çalışma ortamında persistence fallback değildir.
            var semaphore = TestLocks.GetOrAdd(lockKey, _ => new SemaphoreSlim(1, 1));
            await semaphore.WaitAsync(cancellationToken);
            _heldLocks.Add(semaphore);
        }
    }

    public Task CommitAsync(CancellationToken cancellationToken = default) =>
        _transaction?.CommitAsync(cancellationToken) ?? Task.CompletedTask;

    public async ValueTask DisposeAsync()
    {
        if (_transaction is not null) await _transaction.DisposeAsync();
        foreach (var semaphore in _heldLocks) semaphore.Release();
    }
}
