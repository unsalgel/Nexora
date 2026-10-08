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
    public async Task ProcessExpiredCouponsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        var expiredCoupons = await dbContext.Coupons
            .Where(c => c.IsActive && !c.IsDeleted && (c.ExpirationDateUtc <= now || c.CurrentUsageCount >= c.TotalUsageLimit))
            .ToListAsync(cancellationToken);

        if (expiredCoupons.Count == 0)
        {
            return;
        }

        foreach (var coupon in expiredCoupons)
        {
            coupon.IsActive = false;
            coupon.UpdatedAtUtc = now;
        }

        var affectedCount = await dbContext.SaveChangesAsync(cancellationToken);
        var logMessage = $"{affectedCount} adet süresi dolan veya limiti biten kupon başarıyla pasife çekildi.";

        logger.LogInformation("{Count} adet süresi dolan veya limiti biten kupon başarıyla pasife çekildi.", affectedCount);
        await dbLogger.LogInformationAsync("Hangfire.CouponCleanupJob", logMessage, cancellationToken: cancellationToken);
    }
}
