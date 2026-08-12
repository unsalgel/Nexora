using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Nexora.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class ApiControllerBase : ControllerBase
{
    private ISender? _senderInstance;

    protected ISender Sender => _senderInstance ??= HttpContext.RequestServices.GetRequiredService<ISender>();

    protected Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Geçerli bir kullanıcı oturumu bulunamadı.");
        }
        return userId;
    }
}
