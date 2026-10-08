namespace Nexora.Application.Abstractions.BackgroundJobs;

// Belirli süre boyunca ödenmeyen bekleyen siparişleri otomatik iptal eden arka plan görevi
public interface IOrderCleanupJob
{
    Task CancelStalePendingOrdersAsync(CancellationToken cancellationToken = default);
}
