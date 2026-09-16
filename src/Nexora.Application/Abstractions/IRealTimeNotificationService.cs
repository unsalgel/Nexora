namespace Nexora.Application.Abstractions;

public interface IRealTimeNotificationService
{
    Task PublishToAllAsync(string eventName, object data, CancellationToken cancellationToken = default);
    Task PublishToUserAsync(Guid userId, string eventName, object data, CancellationToken cancellationToken = default);
}
