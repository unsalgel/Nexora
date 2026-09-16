using Microsoft.AspNetCore.SignalR;
using Nexora.Api.Hubs;
using Nexora.Application.Abstractions;

namespace Nexora.Api.Services;

public sealed class RealTimeNotificationService : IRealTimeNotificationService
{
    private readonly IHubContext<AppHub> _hubContext;

    public RealTimeNotificationService(IHubContext<AppHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task PublishToAllAsync(string eventName, object data, CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients.All.SendAsync(eventName, data, cancellationToken);
    }

    public async Task PublishToUserAsync(Guid userId, string eventName, object data, CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients.User(userId.ToString()).SendAsync(eventName, data, cancellationToken);
    }
}
