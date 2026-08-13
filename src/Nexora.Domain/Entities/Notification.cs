using Nexora.Domain.Enums;

namespace Nexora.Domain.Entities;

public sealed class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public string Title { get; set; } = default!;
    public string Message { get; set; } = default!;
    public NotificationType Type { get; set; }

    public bool IsRead { get; set; } = false;
    public DateTime? ReadAtUtc { get; set; }
}
