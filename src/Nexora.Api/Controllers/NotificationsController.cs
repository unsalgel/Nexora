using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Notifications.Commands.MarkAllAsRead;
using Nexora.Application.Features.Notifications.Commands.MarkAsRead;
using Nexora.Application.Features.Notifications.Dtos;
using Nexora.Application.Features.Notifications.Queries.GetUserNotifications;

namespace Nexora.Api.Controllers;

[Authorize]
public sealed class NotificationsController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<Result<PagedResult<NotificationDto>>>> GetNotifications(
        int page = 1,
        int pageSize = 20,
        bool? onlyUnread = null,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var query = new GetUserNotificationsQuery(userId, page, pageSize, onlyUnread);
        var result = await Sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}/read")]
    public async Task<ActionResult<Result<string>>> MarkAsRead(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var command = new MarkNotificationAsReadCommand(userId, id);
        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPut("read-all")]
    public async Task<ActionResult<Result<string>>> MarkAllAsRead(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var command = new MarkAllNotificationsAsReadCommand(userId);
        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }
}
