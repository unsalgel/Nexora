namespace Nexora.Domain.Entities;

public sealed class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public string Token { get; set; } = default!;
    public DateTime ExpiresAtUtc { get; set; }
    public bool IsRevoked { get; set; }
}
