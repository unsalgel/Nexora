using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;

namespace Nexora.Api.HealthChecks;

public sealed class RedisHealthCheck(IConnectionMultiplexer connection) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            await connection.GetDatabase().PingAsync().WaitAsync(TimeSpan.FromSeconds(3), cancellationToken);
            return HealthCheckResult.Healthy();
        }
        catch (Exception ex) when (ex is RedisException or TimeoutException)
        {
            return HealthCheckResult.Unhealthy("Kimlik doğrulama sayacı için Redis bağlantısı kullanılamıyor.");
        }
    }
}
