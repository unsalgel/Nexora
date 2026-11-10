using System.Security.Claims;
using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Nexora.Infrastructure.Payments;

namespace Nexora.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
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

    protected bool IsAdmin => User.IsInRole("Admin");

    protected IActionResult RedirectToPaymentResult(string? orderNumber)
    {
        var configuration = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var environment = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
        var destination = IyzicoSettings.BuildPaymentResultUrl(
            configuration["Frontend:BaseUrl"],
            environment.IsDevelopment(),
            orderNumber);

        Response.Headers.Location = destination;
        return StatusCode(StatusCodes.Status303SeeOther);
    }
}
