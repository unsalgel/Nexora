using System.ComponentModel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Application.Abstractions.BackgroundJobs;
using Nexora.Domain.Enums;

namespace Nexora.Infrastructure.BackgroundJobs;

public sealed class OrderCleanupJob(
    IApplicationDbContext dbContext,
    ILogger<OrderCleanupJob> logger,
    IDbLogger dbLogger) : IOrderCleanupJob
{
    [DisplayName("1 gün ödenmeyen beklemedeki siparişleri iptal edip stokları geri yükler")]
    public async Task CancelStalePendingOrdersAsync(CancellationToken cancellationToken = default)
    {
        var cutoffTime = DateTime.UtcNow.AddHours(-24);
        const int batchSize = 100;
        const int maxBatches = 10;
        var totalProcessed = 0;

        for (var batchIndex = 0; batchIndex < maxBatches; batchIndex++)
        {
            var staleOrders = await dbContext.Orders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .Include(o => o.Items)
                    .ThenInclude(i => i.ProductVariant)
                .Where(o => o.PaymentToken == null && o.Status == OrderStatus.Pending &&
                            o.PaymentStatus == PaymentStatus.Pending &&
                            o.CreatedAtUtc <= cutoffTime)
                .OrderBy(o => o.CreatedAtUtc)
                .Take(batchSize)
                .ToListAsync(cancellationToken);

            if (staleOrders.Count == 0)
            {
                break;
            }

            foreach (var order in staleOrders)
            {
                order.CancelAndRestock(PaymentStatus.Failed);
                logger.LogInformation("Zaman aşımına uğrayan sipariş otomatik iptal edildi: {OrderNumber}", order.OrderNumber);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            totalProcessed += staleOrders.Count;

            if (staleOrders.Count < batchSize)
            {
                break;
            }
        }

        if (totalProcessed > 0)
        {
            var summaryMessage = $"{totalProcessed} adet bekleyen sipariş iptal edilerek rezerve stokları iade edildi.";
            logger.LogInformation("{Count} adet bekleyen sipariş iptal edilerek stokları iade edildi.", totalProcessed);
            await dbLogger.LogInformationAsync("Hangfire.OrderCleanupJob", summaryMessage, cancellationToken: cancellationToken);
        }
    }
}
