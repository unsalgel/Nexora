namespace Nexora.Domain.Entities;

public sealed class UserAddress : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public string Title { get; set; } = default!; // Örn: Evim, İş Yeri
    public string FullName { get; set; } = default!;
    public string PhoneNumber { get; set; } = default!;
    public string City { get; set; } = default!;
    public string District { get; set; } = default!;
    public string DetailedAddress { get; set; } = default!;
    public string? PostalCode { get; set; }
    public bool IsDefault { get; set; } = false;
    public bool IsDeleted { get; set; } = false;
}
