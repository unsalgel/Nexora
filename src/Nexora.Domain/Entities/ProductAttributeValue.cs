namespace Nexora.Domain.Entities;

public sealed class ProductAttributeValue : BaseEntity
{
    public Guid ProductAttributeId { get; set; }
    public ProductAttribute ProductAttribute { get; set; } = default!;

    public string Value { get; set; } = default!;
}
