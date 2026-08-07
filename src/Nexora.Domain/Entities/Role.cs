namespace Nexora.Domain.Entities;

public sealed class Role : BaseEntity
{
    public string Name { get; set; } = default!;

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
