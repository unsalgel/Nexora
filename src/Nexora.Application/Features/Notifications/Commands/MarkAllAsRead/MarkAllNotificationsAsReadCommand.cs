using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Notifications.Commands.MarkAllAsRead;

public sealed record MarkAllNotificationsAsReadCommand(Guid UserId) : IRequest<Result<string>>;
