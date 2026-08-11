namespace Nexora.Domain.Entities;

public sealed class ProductAttribute : BaseEntity
{
    public string Name { get; set; } = default!;

    public ICollection<ProductAttributeValue> Values { get; set; } = new List<ProductAttributeValue>();
}
