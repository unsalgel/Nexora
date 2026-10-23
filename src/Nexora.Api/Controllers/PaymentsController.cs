using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Payments.Commands.CompletePayment;
using Nexora.Application.Features.Payments.Commands.InitializePayment;
using Nexora.Application.Features.Payments.Dtos;
using Nexora.Application.Features.Payments.Queries.GetPaymentStatus;

namespace Nexora.Api.Controllers;

public sealed class PaymentsController(IConfiguration configuration, IWebHostEnvironment environment) : ApiControllerBase
{
    [HttpPost("initialize")]
    [Authorize]
    public async Task<ActionResult<Result<PaymentInitializationResult>>> Initialize(
        InitializePaymentCommand command,
        CancellationToken cancellationToken = default)
    {
        var safeCommand = command with { UserId = GetCurrentUserId(), IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() };
        var result = await Sender.Send(safeCommand, cancellationToken);
        return Ok(result);
    }

    [HttpPost("callback")]
    [AllowAnonymous]
    [Consumes("application/x-www-form-urlencoded")]
    public async Task<IActionResult> Callback(
        [FromForm] string token,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new CompletePaymentCommand(token), cancellationToken);
        var frontend = configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
        if (!Uri.TryCreate(frontend, UriKind.Absolute, out var uri) || !string.IsNullOrEmpty(uri.UserInfo) ||
            !(uri.Scheme == "https" || environment.IsDevelopment() && uri.IsLoopback && uri.Scheme == "http"))
            throw new InvalidOperationException("Frontend:BaseUrl güvenilir bir HTTPS adresi olmalıdır.");
        var destination = new Uri(uri, "/payment-result").AbsoluteUri;
        if (result.Data?.OrderNumber is { } orderNumber)
            destination += "?order=" + Uri.EscapeDataString(orderNumber);
        // POST -> GET; the browser URL is only a reference, never evidence of payment.
        Response.Headers.Location = destination;
        return StatusCode(StatusCodes.Status303SeeOther);
    }

    [HttpGet("status/{orderNumber}")]
    [Authorize]
    public async Task<ActionResult<Result<PaymentStatusDto>>> Status(string orderNumber, CancellationToken cancellationToken)
        => Ok(await Sender.Send(new GetPaymentStatusQuery(GetCurrentUserId(), orderNumber), cancellationToken));
}
