namespace Nexora.Domain.Entities;

public sealed class OutboxMessage : BaseEntity
{
    public string Kind { get; set; } = default!;
    public string ProtectedPayload { get; set; } = default!;
    public DateTime AvailableAtUtc { get; set; }
    public DateTime? ProcessedAtUtc { get; set; }
    public int Attempts { get; set; }
    public string? LastError { get; set; }
}
