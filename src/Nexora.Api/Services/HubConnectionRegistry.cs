using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;

namespace Nexora.Api.Services;

public sealed class HubConnectionRegistry
{
    private readonly ConcurrentDictionary<string, HubCallerContext> _connections = new();
    public IReadOnlyCollection<HubCallerContext> Connections => _connections.Values.ToArray();
    public void Add(HubCallerContext context) => _connections[context.ConnectionId] = context;
    public void Remove(string connectionId) => _connections.TryRemove(connectionId, out _);
}

public sealed class HubSessionMonitor(IServiceScopeFactory scopes, HubConnectionRegistry registry, ILogger<HubSessionMonitor> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(10));
        while (await timer.WaitForNextTickAsync(ct))
        {
            foreach (var connection in registry.Connections)
            {
                if (connection.User?.Identity?.IsAuthenticated != true) continue;
                try
                {
                    using var scope = scopes.CreateScope();
                    var validator = scope.ServiceProvider.GetRequiredService<AuthenticationSessionValidator>();
                    if (await validator.IsValidAsync(connection.User, ct)) continue;
                }
                catch (OperationCanceledException) when (ct.IsCancellationRequested) { return; }
                catch (Exception ex) { logger.LogWarning(ex, "Hub oturum doğrulaması başarısız; bağlantı kapatılıyor."); }
                registry.Remove(connection.ConnectionId);
                connection.Abort();
            }
        }
    }
}