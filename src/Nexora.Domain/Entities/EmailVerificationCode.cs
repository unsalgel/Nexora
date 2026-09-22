namespace Nexora.Domain.Entities;

public sealed class EmailVerificationCode : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public string Code { get; set; } = default!;
    public DateTime ExpiresAtUtc { get; set; }
    public bool IsUsed { get; set; }
}
