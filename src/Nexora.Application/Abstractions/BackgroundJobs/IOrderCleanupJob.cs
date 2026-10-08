using System.ComponentModel;

namespace Nexora.Application.Abstractions.BackgroundJobs;

// Belirli süre boyunca ödenmeyen bekleyen siparişleri otomatik iptal eden arka plan görevi
public interface IOrderCleanupJob
{
    [DisplayName("1 Gündür ödenmeyen beklemedeki siparişleri iptal edip stokları geri yükler")]
    Task CancelStalePendingOrdersAsync(CancellationToken cancellationToken = default);
}
