using System.ComponentModel;

namespace Nexora.Application.Abstractions.BackgroundJobs;

// Süresi dolan indirim kuponlarını otomatik pasife çeken arka plan görevi
public interface ICouponCleanupJob
{
    [DisplayName("Süresi dolan veya tükenen indirim kuponlarını otomatik pasife alır")]
    Task ProcessExpiredCouponsAsync(CancellationToken cancellationToken = default);
}
