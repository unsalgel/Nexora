using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Payments.Commands.CompletePayment;
using Nexora.Application.Features.Payments.Commands.InitializePayment;
using Nexora.Application.Features.Payments.Dtos;

namespace Nexora.Api.Controllers;

public sealed class PaymentsController : ApiControllerBase
{
    [HttpPost("initialize")]
    [Authorize]
    public async Task<ActionResult<Result<PaymentInitializationResult>>> Initialize(
        InitializePaymentCommand command,
        CancellationToken cancellationToken = default)
    {
        var safeCommand = command with { UserId = GetCurrentUserId() };
        var result = await Sender.Send(safeCommand, cancellationToken);
        return Ok(result);
    }

    [HttpPost("callback")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<PaymentVerificationResult>>> Callback(
        CompletePaymentCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }
}
