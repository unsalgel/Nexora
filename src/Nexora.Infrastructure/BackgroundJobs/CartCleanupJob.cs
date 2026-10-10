using System.ComponentModel;
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
    [DisplayName("1 aydan eski sahipsiz sepetleri ve satırlarını temizler")]
    public async Task CleanupAbandonedCartsAsync(CancellationToken cancellationToken = default)
    {
        var cutoffTime = DateTime.UtcNow.AddDays(-30);

        var users = await dbContext.CartItems.AsNoTracking()
            .Where(ci => (ci.UpdatedAtUtc ?? ci.CreatedAtUtc) <= cutoffTime)
            .Select(ci => ci.Cart.UserId).Distinct().OrderBy(id => id).Take(100)
            .ToListAsync(cancellationToken);
        var affectedCount = 0;
        foreach (var userId in users)
        {
            // Kullanıcı komutları aynı kilidi alır; güncel bir satır ilk taramanın eski görüntüsüne göre silinmez.
            await using var transaction = await dbContext.BeginTransactionAsync($"usercart:{userId}", cancellationToken);
            var staleCartItems = await dbContext.CartItems
                .Where(ci => ci.Cart.UserId == userId && (ci.UpdatedAtUtc ?? ci.CreatedAtUtc) <= cutoffTime)
                .OrderBy(ci => ci.Id).Take(1000).ToListAsync(cancellationToken);
            dbContext.CartItems.RemoveRange(staleCartItems);
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            affectedCount += staleCartItems.Count;
        }
        if (affectedCount == 0) return;

        var logMessage = $"{affectedCount} adet 30 günden eski sahipsiz sepet öğesi temizlendi.";
        logger.LogInformation("{Count} adet 30 günden eski sahipsiz sepet öğesi temizlendi.", affectedCount);
        await dbLogger.LogInformationAsync("Hangfire.CartCleanupJob", logMessage, cancellationToken: cancellationToken);
    }
}
