namespace Nexora.Application.Abstractions;

public interface IAuditContext
{
    Guid? ActorId { get; }
    string TraceId { get; }
}
