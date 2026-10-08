using System.ComponentModel;

namespace Nexora.Application.Abstractions.BackgroundJobs;

// Eski veya sahipsiz kalan sepetleri temizleyen arka plan görevi
public interface ICartCleanupJob
{
    [DisplayName("1 aydan eski sahipsiz sepetleri ve satırlarını temizler")]
    Task CleanupAbandonedCartsAsync(CancellationToken cancellationToken = default);
}
