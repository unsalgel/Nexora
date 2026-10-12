namespace Nexora.Domain.Entities;

public sealed class AuditEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? ActorId { get; set; }
    public string TraceId { get; set; } = "";
    public string EntityType { get; set; } = "";
    public string EntityId { get; set; } = "";
    public string Action { get; set; } = "";
    public string Changes { get; set; } = "{}";
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
}
