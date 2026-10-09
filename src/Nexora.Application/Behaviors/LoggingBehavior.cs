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

            if (ex is OperationCanceledException)
            {
                _logger.LogInformation("İstek iptal edildi: {RequestName} ({ElapsedMilliseconds}ms)",
                    requestName, timer.ElapsedMilliseconds);
            }
            else if (ex is FluentValidation.ValidationException || ex is Domain.Exceptions.DomainException)
            {
                _logger.LogWarning("İş kuralı / doğrulama uyarısı: {RequestName} ({ElapsedMilliseconds}ms) - {Message}",
                    requestName, timer.ElapsedMilliseconds, ex.Message);
            }
            else
            {
                _logger.LogError(ex, "İşlem sırasında beklenmeyen hata oluştu: {RequestName} ({ElapsedMilliseconds}ms)",
                    requestName, timer.ElapsedMilliseconds);
            }

            throw;
        }
    }
}
