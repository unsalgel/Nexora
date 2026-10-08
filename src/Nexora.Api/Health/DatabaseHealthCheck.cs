using Microsoft.Extensions.Diagnostics.HealthChecks;
using Nexora.Persistence.Context;

namespace Nexora.Api.Health;

public sealed class DatabaseHealthCheck : IHealthCheck
{
    private readonly NexoraDbContext _context;

    public DatabaseHealthCheck(NexoraDbContext context)
    {
        _context = context;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var canConnect = await _context.Database.CanConnectAsync(cancellationToken);
            return canConnect
                ? HealthCheckResult.Healthy("Veritabanı bağlantısı sağlıklı.")
                : HealthCheckResult.Unhealthy("Veritabanına bağlanılamadı.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Veritabanı kontrolü başarısız oldu.", ex);
        }
    }
}
