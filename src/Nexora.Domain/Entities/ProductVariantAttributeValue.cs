namespace Nexora.Domain.Entities;

public sealed class ProductVariantAttributeValue
{
    public Guid ProductVariantId { get; set; }
    public ProductVariant ProductVariant { get; set; } = default!;

    public Guid ProductAttributeValueId { get; set; }
    public ProductAttributeValue ProductAttributeValue { get; set; } = default!;
}
