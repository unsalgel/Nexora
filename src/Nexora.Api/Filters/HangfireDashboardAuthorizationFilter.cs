using Hangfire.Dashboard;

namespace Nexora.Api.Filters;

public sealed class HangfireDashboardAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();

        if (httpContext.User.Identity?.IsAuthenticated == true && httpContext.User.IsInRole("Admin"))
        {
            return true;
        }

        var env = httpContext.RequestServices.GetService(typeof(Microsoft.AspNetCore.Hosting.IWebHostEnvironment)) as Microsoft.AspNetCore.Hosting.IWebHostEnvironment;
        if (env?.EnvironmentName == "Development")
        {
            var remoteIp = httpContext.Connection.RemoteIpAddress;
            if (remoteIp != null && (remoteIp.Equals(httpContext.Connection.LocalIpAddress) || System.Net.IPAddress.IsLoopback(remoteIp)))
            {
                return true;
            }
        }

        return false;
    }
}
