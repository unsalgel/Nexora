namespace Nexora.Domain.Entities;

public sealed class Brand : BaseEntity
{
    public string Name { get; set; } = default!;
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
}
