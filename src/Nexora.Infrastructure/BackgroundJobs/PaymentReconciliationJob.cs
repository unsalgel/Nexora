using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Payments.Commands.CompletePayment;
using Nexora.Domain.Enums;

namespace Nexora.Infrastructure.BackgroundJobs;

public sealed class PaymentReconciliationJob(IServiceScopeFactory scopes, ILogger<PaymentReconciliationJob> logger)
{
    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        using var readScope = scopes.CreateScope();
        var context = readScope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var due = await context.Orders.AsNoTracking()
            .Where(o => o.PaymentToken != null &&
                o.PaymentStatus != PaymentStatus.Success && o.PaymentStatus != PaymentStatus.Failed && o.PaymentStatus != PaymentStatus.Refunded &&
                (o.NextPaymentCheckAtUtc == null || o.NextPaymentCheckAtUtc <= DateTime.UtcNow))
            .OrderBy(o => o.NextPaymentCheckAtUtc).Take(100)
            .Select(o => new { o.OrderNumber, o.PaymentToken }).ToListAsync(cancellationToken);
        foreach (var payment in due)
        {
            cancellationToken.ThrowIfCancellationRequested();
            try
            {
                // A fresh context also discards tracked state after a failed transaction.
                using var scope = scopes.CreateScope();
                await scope.ServiceProvider.GetRequiredService<ISender>()
                    .Send(new CompletePaymentCommand(payment.PaymentToken!), cancellationToken);
                var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
                if (await db.Orders.AnyAsync(o => o.OrderNumber == payment.OrderNumber && o.PaymentStatus == PaymentStatus.RequiresAttention, cancellationToken))
                    logger.LogWarning("Ödeme manuel inceleme gerektiriyor. Sipariş: {OrderNumber}", payment.OrderNumber);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                logger.LogError(ex, "Ödeme uzlaştırması tekrar denenecek. Sipariş: {OrderNumber}", payment.OrderNumber);
            }
        }
    }
}