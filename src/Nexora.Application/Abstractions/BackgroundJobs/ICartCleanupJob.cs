namespace Nexora.Application.Abstractions.BackgroundJobs;

// Eski veya sahipsiz kalan sepetleri temizleyen arka plan görevi
public interface ICartCleanupJob
{
    Task CleanupAbandonedCartsAsync(CancellationToken cancellationToken = default);
}
