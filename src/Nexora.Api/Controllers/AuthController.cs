using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Auth.Dtos;
using Nexora.Application.Features.Auth.Commands.Login;
using Nexora.Application.Features.Auth.Commands.RefreshToken;
using Nexora.Application.Features.Auth.Commands.Register;
using Nexora.Application.Features.Auth.Commands.RevokeToken;

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
    [Authorize]
    public async Task<ActionResult<Result<string>>> RevokeToken(
        RevokeTokenCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }
}
