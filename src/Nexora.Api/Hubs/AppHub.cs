using Microsoft.AspNetCore.SignalR;

namespace Nexora.Api.Hubs;

public sealed class AppHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        if (Context.User?.IsInRole("Admin") == true)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
        }

        await base.OnConnectedAsync();
    }
}
