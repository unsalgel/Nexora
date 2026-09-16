using System.Text;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Domain.Entities;

namespace Nexora.Infrastructure.Services;

public sealed class DbLogger : IDbLogger
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<DbLogger> _logger;

    public DbLogger(IApplicationDbContext context, ILogger<DbLogger> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task LogErrorAsync(
        string source,
        Exception ex,
        string? endpoint = null,
        string? userEmail = null,
        string? clientIp = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var detailsBuilder = new StringBuilder();
            detailsBuilder.AppendLine($"Hata Türü: {ex.GetType().FullName}");
            detailsBuilder.AppendLine($"Hata Mesajı: {ex.Message}");

            if (ex.TargetSite is not null)
            {
                detailsBuilder.AppendLine($"Hedef Fonksiyon: {ex.TargetSite.DeclaringType?.FullName}.{ex.TargetSite.Name}");
            }

            if (!string.IsNullOrEmpty(ex.StackTrace))
            {
                detailsBuilder.AppendLine("Çağrı Yığını (Stack Trace):");
                detailsBuilder.AppendLine(ex.StackTrace);
            }

            if (ex.InnerException is not null)
            {
                detailsBuilder.AppendLine($"İç Hata (Inner Exception): {ex.InnerException.Message}");
            }

            var logEntry = new Log
            {
                Id = Guid.NewGuid(),
                Level = "Error",
                Message = ex.Message,
                Source = source,
                Endpoint = endpoint,
                UserEmail = userEmail,
                ClientIp = clientIp,
                Exception = detailsBuilder.ToString(),
                TimestampUtc = DateTime.UtcNow
            };

            _context.Logs.Add(logEntry);
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception loggingEx)
        {
            _logger.LogError(loggingEx, "Veritabanına hata logu yazılırken beklenmeyen sorun oluştu.");
        }
    }

    public async Task LogWarningAsync(
        string source,
        string message,
        long durationMs,
        string? endpoint = null,
        string? userEmail = null,
        string? clientIp = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var logEntry = new Log
            {
                Id = Guid.NewGuid(),
                Level = "Warning",
                Message = message,
                Source = source,
                Endpoint = endpoint,
                UserEmail = userEmail,
                ClientIp = clientIp,
                ExecutionDurationMs = durationMs,
                TimestampUtc = DateTime.UtcNow
            };

            _context.Logs.Add(logEntry);
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception loggingEx)
        {
            _logger.LogError(loggingEx, "Veritabanına yavaşlık logu yazılırken beklenmeyen sorun oluştu.");
        }
    }
}
