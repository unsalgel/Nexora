using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Auth.Dtos;
using Nexora.Application.Features.Auth.Commands.Login;
using Nexora.Application.Features.Auth.Commands.RefreshToken;
using Nexora.Application.Features.Auth.Commands.Register;
using Nexora.Application.Features.Auth.Commands.RevokeToken;
using Nexora.Application.Features.Auth.Commands.ForgotPassword;
using Nexora.Application.Features.Auth.Commands.ResetPassword;
using Nexora.Application.Features.Auth.Commands.VerifyEmail;
using Nexora.Application.Features.Auth.Commands.ResendVerificationCode;

namespace Nexora.Api.Controllers;

public sealed class AuthController : ApiControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<string>>> Register(
        RegisterCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(command, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<AuthTokenDto>>> Login(
        LoginCommand command,
        CancellationToken cancellationToken = default)
    {
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString();
        var safeCommand = command with { IpAddress = clientIp };
        var result = await Sender.Send(safeCommand, cancellationToken);
        return Ok(result);
    }

    [HttpPost("verify-email")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<string>>> VerifyEmail(
        VerifyEmailCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPost("resend-verification-code")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<string>>> ResendVerificationCode(
        ResendVerificationCodeCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<AuthTokenDto>>> RefreshToken(
        RefreshTokenCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPost("revoke-token")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<string>>> RevokeToken(
        RevokeTokenCommand command,
        CancellationToken cancellationToken = default)
    {
        var jti = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Jti)?.Value;
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        Guid.TryParse(userIdClaim, out var userId);

        var commandWithValidatedData = command with
        {
            Jti = jti,
            UserId = userId != Guid.Empty ? userId : null
        };
        var result = await Sender.Send(commandWithValidatedData, cancellationToken);
        return Ok(result);
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<string>>> ForgotPassword(
        ForgotPasswordCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<string>>> ResetPassword(
        ResetPasswordCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }
}
