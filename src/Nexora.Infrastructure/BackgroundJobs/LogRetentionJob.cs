using Hangfire;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;

namespace Nexora.Infrastructure.BackgroundJobs;

public sealed class LogRetentionJob(IApplicationDbContext context)
{
    [DisableConcurrentExecution(120)]
    public async Task RunAsync(CancellationToken ct = default)
    {
        var logCutoff = DateTime.UtcNow.AddDays(-30);
        var auditCutoff = DateTime.UtcNow.AddDays(-365);
        var logs = await context.Logs.Where(x => x.TimestampUtc < logCutoff)
            .OrderBy(x => x.TimestampUtc).Take(1000).ToListAsync(ct);
        var audits = await context.AuditEntries.Where(x => x.TimestampUtc < auditCutoff)
            .OrderBy(x => x.TimestampUtc).Take(1000).ToListAsync(ct);
        context.Logs.RemoveRange(logs);
        context.AuditEntries.RemoveRange(audits);
        await context.SaveChangesAsync(ct);
    }
}
