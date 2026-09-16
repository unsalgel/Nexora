namespace Nexora.Domain.Entities;

public sealed class Log
{
    public Guid Id { get; set; }
    public string Message { get; set; } = default!;
    public string? MessageTemplate { get; set; }
    public string Level { get; set; } = default!;
    public DateTime TimestampUtc { get; set; }
    public string? Exception { get; set; }
    public string? Properties { get; set; }
    public string? Source { get; set; }
    public string? Endpoint { get; set; }
    public string? UserEmail { get; set; }
    public string? ClientIp { get; set; }
    public long? ExecutionDurationMs { get; set; }
}
