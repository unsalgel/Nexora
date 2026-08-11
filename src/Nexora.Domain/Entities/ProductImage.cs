namespace Nexora.Domain.Entities;

public sealed class ProductImage : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = default!;

    public string ImageUrl { get; set; } = default!;
    public bool IsMain { get; set; } = false;
    public int DisplayOrder { get; set; } = 0;
}
