namespace Nexora.Application.Features.Notifications.Dtos;

public sealed record NotificationDto(
    Guid Id,
    Guid UserId,
    string Title,
    string Message,
    string Type,
    bool IsRead,
    DateTime? ReadAtUtc,
    DateTime CreatedAtUtc);
