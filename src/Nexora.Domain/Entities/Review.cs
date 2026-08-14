using System.ComponentModel.DataAnnotations;

namespace Nexora.Domain.Entities;

public sealed class Review : BaseEntity
{
    public Guid ProductId { get; set; }
    public Guid UserId { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; }

    public string? Comment { get; set; }

    // Navigation Properties
    public Product Product { get; set; } = null!;
    public User User { get; set; } = null!;
}
