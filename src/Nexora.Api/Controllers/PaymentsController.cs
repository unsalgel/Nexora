using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Payments.Commands.CompletePayment;
using Nexora.Application.Features.Payments.Commands.InitializePayment;
using Nexora.Application.Features.Payments.Dtos;
using Nexora.Application.Features.Payments.Queries.GetPaymentStatus;

namespace Nexora.Api.Controllers;

[Authorize]
public sealed class PaymentsController : ApiControllerBase
{
    [HttpPost("initialize")]
    public async Task<ActionResult<Result<PaymentInitializationResult>>> Initialize(
        InitializePaymentCommand command,
        CancellationToken cancellationToken = default)
    {
        var safeCommand = command with
        {
            UserId = GetCurrentUserId(),
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
        };
        var result = await Sender.Send(safeCommand, cancellationToken);
        return Ok(result);
    }

    [HttpPost("callback")]
    [AllowAnonymous]
    [Consumes("application/x-www-form-urlencoded")]
    public async Task<IActionResult> Callback(CancellationToken cancellationToken = default)
    {
        var command = new CompletePaymentCommand(Request.Form["token"].ToString());
        var result = await Sender.Send(command, cancellationToken);
        return RedirectToPaymentResult(result.Data?.OrderNumber);
    }

    [HttpGet("status/{orderNumber}")]
    public async Task<ActionResult<Result<PaymentStatusDto>>> Status(
        string orderNumber,
        CancellationToken cancellationToken = default)
    {
        var query = new GetPaymentStatusQuery(GetCurrentUserId(), orderNumber);
        var result = await Sender.Send(query, cancellationToken);
        return Ok(result);
    }
}
