using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Nexora.Api.Hubs;
using Nexora.Application.Abstractions;

namespace Nexora.Api.Services;

public sealed class RealTimeNotificationService(IHubContext<AppHub> hub, HubConnectionRegistry registry,
    AuthenticationSessionValidator validator, ILogger<RealTimeNotificationService> logger) : IRealTimeNotificationService
{
    public Task PublishToAllAsync(string eventName, object data, CancellationToken ct = default) =>
        SendSafelyAsync(() => hub.Clients.All.SendAsync(eventName, data, ct));

    public async Task PublishToAdminsAsync(string eventName, object data, CancellationToken ct = default)
    {
        foreach (var connection in registry.Connections.Where(c => c.User?.IsInRole("Admin") == true))
            await SendPrivateAsync(connection, eventName, data, ct);
    }
    public async Task PublishToUserAsync(Guid userId, string eventName, object data, CancellationToken ct = default)
    {
        foreach (var connection in registry.Connections.Where(c => c.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value == userId.ToString()))
        {
            if (eventName is "SessionRevoked" or "AccountFrozen")
            {
                await SendSafelyAsync(() => hub.Clients.Client(connection.ConnectionId).SendAsync(eventName, data, ct));
                registry.Remove(connection.ConnectionId);
                connection.Abort();
            }
            else await SendPrivateAsync(connection, eventName, data, ct);
        }
    }
    private async Task SendPrivateAsync(HubCallerContext connection, string eventName, object data, CancellationToken ct)
    {
        try
        {
            if (!await validator.IsValidAsync(connection.User, ct))
            {
                registry.Remove(connection.ConnectionId);
                connection.Abort();
                return;
            }
            await hub.Clients.Client(connection.ConnectionId).SendAsync(eventName, data, ct);
        }
        catch (Exception ex)
        {
            // Güncel yetki doğrulanamadığında özel veri gönderilmeden bağlantı kapatılır.
            registry.Remove(connection.ConnectionId);
            connection.Abort();
            logger.LogWarning(ex, "Özel gerçek zamanlı bildirim gönderilemedi.");
        }
    }
    private async Task SendSafelyAsync(Func<Task> send)
    {
        try { await send(); }
        catch (Exception ex) { logger.LogWarning(ex, "Gerçek zamanlı bildirim gönderilemedi."); }
    }
}
