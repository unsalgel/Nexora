namespace Nexora.Domain.Entities;

public sealed class Category : BaseEntity
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public Guid? ParentCategoryId { get; set; }
    public Category? ParentCategory { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;

    public ICollection<Category> SubCategories { get; set; } = new List<Category>();
}
