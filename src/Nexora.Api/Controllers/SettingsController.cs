using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Settings.Commands.UpdateSiteSettings;
using Nexora.Application.Features.Settings.Dtos;
using Nexora.Application.Features.Settings.Queries.GetSiteSettings;

namespace Nexora.Api.Controllers;

public sealed class SettingsController : ApiControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<Result<SiteSettingsDto>>> GetSettings(CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetSiteSettingsQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<SiteSettingsDto>>> UpdateSettings(
        UpdateSiteSettingsCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }
}
