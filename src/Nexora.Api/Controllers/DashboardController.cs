using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Dashboard.Dtos;
using Nexora.Application.Features.Dashboard.Queries.GetSalesAnalytics;

namespace Nexora.Api.Controllers;

[Authorize(Roles = "Admin")]
public sealed class DashboardController : ApiControllerBase
{
    [HttpGet("analytics")]
    public async Task<ActionResult<Result<SalesAnalyticsDto>>> GetSalesAnalytics(
        [FromQuery] int days = 30,
        CancellationToken cancellationToken = default)
    {
        var query = new GetSalesAnalyticsQuery(days);
        var result = await Sender.Send(query, cancellationToken);
        return Ok(result);
    }
}
