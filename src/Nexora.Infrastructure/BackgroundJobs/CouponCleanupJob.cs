using System.ComponentModel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Application.Abstractions.BackgroundJobs;

namespace Nexora.Infrastructure.BackgroundJobs;

public sealed class CouponCleanupJob(
    IApplicationDbContext dbContext,
    ILogger<CouponCleanupJob> logger,
    IDbLogger dbLogger) : ICouponCleanupJob
{
    [DisplayName("Süresi dolan veya tükenen indirim kuponlarını otomatik pasife alır")]
    public async Task ProcessExpiredCouponsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        const int batchSize = 500;
        const int maxBatches = 10;
        var totalAffected = 0;

        for (var batchIndex = 0; batchIndex < maxBatches; batchIndex++)
        {
            var expiredCoupons = await dbContext.Coupons
                .Where(c => c.IsActive && !c.IsDeleted && (c.ExpirationDateUtc <= now || c.CurrentUsageCount >= c.TotalUsageLimit))
                .OrderBy(c => c.Id)
                .Take(batchSize)
                .ToListAsync(cancellationToken);

            if (expiredCoupons.Count == 0)
            {
                break;
            }

            foreach (var coupon in expiredCoupons)
            {
                coupon.IsActive = false;
                coupon.UpdatedAtUtc = now;
            }

            var affectedCount = await dbContext.SaveChangesAsync(cancellationToken);
            totalAffected += affectedCount;

            if (expiredCoupons.Count < batchSize)
            {
                break;
            }
        }

        if (totalAffected > 0)
        {
            var logMessage = $"{totalAffected} adet süresi dolan veya limiti biten kupon başarıyla pasife çekildi.";
            logger.LogInformation("{Count} adet süresi dolan veya limiti biten kupon başarıyla pasife çekildi.", totalAffected);
            await dbLogger.LogInformationAsync("Hangfire.CouponCleanupJob", logMessage, cancellationToken: cancellationToken);
        }
    }
}
