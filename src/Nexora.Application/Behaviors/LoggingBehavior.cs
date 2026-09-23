using System.Diagnostics;
using MediatR;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;

namespace Nexora.Application.Behaviors;

public sealed class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;
    private readonly IDbLogger _dbLogger;

    public LoggingBehavior(
        ILogger<LoggingBehavior<TRequest, TResponse>> logger,
        IDbLogger dbLogger)
    {
        _logger = logger;
        _dbLogger = dbLogger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;

        _logger.LogInformation("İstek Başlatıldı: {RequestName}", requestName);

        var timer = Stopwatch.StartNew();

        try
        {
            var response = await next();
            timer.Stop();

            var elapsedMilliseconds = timer.ElapsedMilliseconds;

            if (elapsedMilliseconds > 500)
            {
                _logger.LogWarning("Yavaş İstek Algılandı: {RequestName} ({ElapsedMilliseconds}ms sürede tamamlandı)",
                    requestName, elapsedMilliseconds);

                await _dbLogger.LogWarningAsync(
                    source: requestName,
                    message: "Yavaş İstek Algılandı",
                    durationMs: elapsedMilliseconds,
                    cancellationToken: cancellationToken);
            }
            else
            {
                _logger.LogInformation("İstek Başarıyla Tamamlandı: {RequestName} ({ElapsedMilliseconds}ms)",
                    requestName, elapsedMilliseconds);
            }

            return response;
        }
        catch (Exception ex)
        {
            timer.Stop();

            _logger.LogError(ex, "İşlem Sırasında Hata Oluştu: {RequestName} ({ElapsedMilliseconds}ms)",
                requestName, timer.ElapsedMilliseconds);

            await _dbLogger.LogErrorAsync(
                source: requestName,
                ex: ex,
                cancellationToken: cancellationToken);

            throw;
        }
    }
}
