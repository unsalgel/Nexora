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
    public async Task CancelStalePendingOrdersAsync(CancellationToken cancellationToken = default)
    {
        var cutoffTime = DateTime.UtcNow.AddHours(-24);

        var staleOrders = await dbContext.Orders
            .Include(o => o.Items)
            .Where(o => o.Status == OrderStatus.Pending && 
                        o.PaymentStatus == PaymentStatus.Pending && 
                        o.CreatedAtUtc <= cutoffTime)
            .ToListAsync(cancellationToken);

        if (staleOrders.Count == 0)
        {
            return;
        }

        foreach (var order in staleOrders)
        {
            order.Status = OrderStatus.Cancelled;
            order.PaymentStatus = PaymentStatus.Failed;
            order.UpdatedAtUtc = DateTime.UtcNow;

            foreach (var item in order.Items)
            {
                if (item.ProductVariantId.HasValue)
                {
                    var variant = await dbContext.ProductVariants
                        .FirstOrDefaultAsync(v => v.Id == item.ProductVariantId.Value, cancellationToken);

                    if (variant != null)
                    {
                        variant.StockQuantity += item.Quantity;
                        variant.UpdatedAtUtc = DateTime.UtcNow;
                    }
                }
                else
                {
                    var product = await dbContext.Products
                        .FirstOrDefaultAsync(p => p.Id == item.ProductId, cancellationToken);

                    if (product != null)
                    {
                        product.StockQuantity += item.Quantity;
                        product.UpdatedAtUtc = DateTime.UtcNow;
                    }
                }
            }

            logger.LogInformation("Zaman aşımına uğrayan sipariş otomatik iptal edildi: {OrderNumber}", order.OrderNumber);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var summaryMessage = $"{staleOrders.Count} adet bekleyen sipariş iptal edilerek rezerve stokları iade edildi.";
        logger.LogInformation("{Count} adet bekleyen sipariş iptal edilerek stokları iade edildi.", staleOrders.Count);
        await dbLogger.LogInformationAsync("Hangfire.OrderCleanupJob", summaryMessage, cancellationToken: cancellationToken);
    }
}
