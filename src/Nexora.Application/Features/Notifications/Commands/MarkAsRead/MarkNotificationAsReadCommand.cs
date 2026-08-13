using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Notifications.Commands.MarkAsRead;

public sealed record MarkNotificationAsReadCommand(
    Guid UserId,
    Guid NotificationId) : IRequest<Result<string>>;
