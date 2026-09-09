namespace Nexora.Domain.Entities;

public sealed class Product : BaseEntity
{
    public string Name { get; set; } = default!;
    public string SKU { get; set; } = default!;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }

    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = default!;

    public Guid BrandId { get; set; }
    public Brand Brand { get; set; } = default!;

    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;

    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
}
