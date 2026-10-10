using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;

namespace Nexora.Application.Common;

public static class NotificationPublishingExtensions
{
    public static async Task PublishToAllSafelyAsync(this IRealTimeNotificationService service, string eventName,
        object data, ILogger? logger, CancellationToken cancellationToken = default)
    {
        try
        {
            await service.PublishToAllAsync(eventName, data, cancellationToken);
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "Kaydedilmiş işlem sonrası realtime yayını başarısız: {EventName}", eventName);
        }
    }
}
