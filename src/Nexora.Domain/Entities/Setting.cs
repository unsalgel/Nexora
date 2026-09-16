namespace Nexora.Domain.Entities;

public sealed class Setting : BaseEntity
{
    public string Key { get; set; } = default!;
    public string Value { get; set; } = default!;
    public string? Description { get; set; }
}
