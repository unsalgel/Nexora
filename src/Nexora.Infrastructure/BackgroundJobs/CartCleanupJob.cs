using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Application.Abstractions.BackgroundJobs;

namespace Nexora.Infrastructure.BackgroundJobs;

public sealed class CartCleanupJob(
    IApplicationDbContext dbContext,
    ILogger<CartCleanupJob> logger,
    IDbLogger dbLogger) : ICartCleanupJob
{
    public async Task CleanupAbandonedCartsAsync(CancellationToken cancellationToken = default)
    {
        var cutoffTime = DateTime.UtcNow.AddDays(-30);

        var staleCartItems = await dbContext.CartItems
            .Where(ci => ci.CreatedAtUtc <= cutoffTime)
            .ToListAsync(cancellationToken);

        if (staleCartItems.Count == 0)
        {
            return;
        }

        dbContext.CartItems.RemoveRange(staleCartItems);
        var affectedCount = await dbContext.SaveChangesAsync(cancellationToken);

        var logMessage = $"{affectedCount} adet 30 günden eski sahipsiz sepet öğesi temizlendi.";
        logger.LogInformation("{Count} adet 30 günden eski sahipsiz sepet öğesi temizlendi.", affectedCount);
        await dbLogger.LogInformationAsync("Hangfire.CartCleanupJob", logMessage, cancellationToken: cancellationToken);
    }
}
