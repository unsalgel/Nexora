using MediatR;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;

namespace Nexora.Application.Behaviors;

public sealed class CachingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ICacheService _cacheService;
    private readonly ILogger<CachingBehavior<TRequest, TResponse>> _logger;

    public CachingBehavior(ICacheService cacheService, ILogger<CachingBehavior<TRequest, TResponse>> logger)
    {
        _cacheService = cacheService;
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (request is ICachableRequest cachableRequest)
        {
            var cachedResponse = await _cacheService.GetAsync<TResponse>(cachableRequest.CacheKey, cancellationToken);
            if (cachedResponse is not null)
            {
                _logger.LogInformation("Önbellekten Yanıt Döndü (Cache HIT): {CacheKey}", cachableRequest.CacheKey);
                return cachedResponse;
            }

            _logger.LogInformation("Önbellekte Bulunamadı, Veritabanından Çekiliyor (Cache MISS): {CacheKey}", cachableRequest.CacheKey);
            var response = await next();

            var isSuccess = response switch
            {
                Common.IResult res => res.IsSuccess,
                _ => true
            };

            if (response is not null && isSuccess)
            {
                await _cacheService.SetAsync(cachableRequest.CacheKey, response, cachableRequest.Expiration, cancellationToken);
            }

            return response;
        }

        if (request is ICacheInvalidatorRequest invalidatorRequest)
        {
            var response = await next();
            await _cacheService.RemoveByPrefixAsync(invalidatorRequest.CacheKeyPrefix, cancellationToken);
            _logger.LogInformation("Önbellek Temizlendi (Invalidation): {Prefix}", invalidatorRequest.CacheKeyPrefix);
            return response;
        }

        return await next();
    }
}
