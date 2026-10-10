using Microsoft.AspNetCore.SignalR;
using Nexora.Api.Services;

namespace Nexora.Api.Hubs;

public sealed class AppHub(HubConnectionRegistry registry, AuthenticationSessionValidator validator) : Hub
{
    public override async Task OnConnectedAsync()
    {
        if (Context.User?.Identity?.IsAuthenticated == true && !await validator.IsValidAsync(Context.User, Context.ConnectionAborted))
        {
            Context.Abort();
            return;
        }
        registry.Add(Context);
        await base.OnConnectedAsync();
    }
    public override Task OnDisconnectedAsync(Exception? exception)
    {
        registry.Remove(Context.ConnectionId);
        return base.OnDisconnectedAsync(exception);
    }
}