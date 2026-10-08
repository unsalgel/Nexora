namespace Nexora.Application.Abstractions.BackgroundJobs;

// Süresi dolan indirim kuponlarını otomatik pasife çeken arka plan görevi
public interface ICouponCleanupJob
{
    Task ProcessExpiredCouponsAsync(CancellationToken cancellationToken = default);
}
