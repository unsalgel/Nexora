namespace Nexora.Domain.Entities;

public sealed class Cart : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
}
