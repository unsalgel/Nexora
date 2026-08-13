using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Notifications.Dtos;

namespace Nexora.Application.Features.Notifications.Queries.GetUserNotifications;

public sealed record GetUserNotificationsQuery(
    Guid UserId,
    int Page = 1,
    int PageSize = 20,
    bool? OnlyUnread = null) : IRequest<Result<PagedResult<NotificationDto>>>;
