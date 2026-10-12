using System.Security.Claims;
using Nexora.Application.Abstractions;

namespace Nexora.Api.Services;

public sealed class HttpAuditContext(IHttpContextAccessor accessor) : IAuditContext
{
    public Guid? ActorId => Guid.TryParse(accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
    public string TraceId => accessor.HttpContext?.TraceIdentifier ?? "background";
}
