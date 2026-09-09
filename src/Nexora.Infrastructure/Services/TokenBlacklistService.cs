using Microsoft.Extensions.Caching.Memory;
using Nexora.Application.Abstractions;

namespace Nexora.Infrastructure.Services;

public sealed class TokenBlacklistService : ITokenBlacklistService
{
    private readonly ICacheService _cacheService;
    private readonly IMemoryCache _memoryCache;

    public TokenBlacklistService(ICacheService cacheService, IMemoryCache memoryCache)
    {
        _cacheService = cacheService;
        _memoryCache = memoryCache;
    }

    private static string GetCacheKey(string jti) => $"revoked_token:{jti}";

    public async Task RevokeTokenAsync(string jti, TimeSpan remainingLifetime, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(jti) || remainingLifetime <= TimeSpan.Zero)
            return;

        var key = GetCacheKey(jti);

        // Hızlı doğrulama için yerel MemoryCache'e yaz
        _memoryCache.Set(key, true, remainingLifetime);

        // Dağıtık (cluster/Redis) doğrulama için Redis Cache'e yaz
        await _cacheService.SetAsync(key, true, remainingLifetime, cancellationToken);
    }

    public async Task<bool> IsTokenRevokedAsync(string jti, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(jti))
            return false;

        var key = GetCacheKey(jti);

        // 1. Önce en hızlı katman olan bellek kontrolü
        if (_memoryCache.TryGetValue<bool>(key, out var isRevokedInMemory) && isRevokedInMemory)
            return true;

        // 2. Redis kontrolü
        var isRevokedInRedis = await _cacheService.GetAsync<bool>(key, cancellationToken);
        if (isRevokedInRedis)
        {
            // Belleğe de ekle ki sonraki istekler Redis'e gitmesin
            _memoryCache.Set(key, true, TimeSpan.FromMinutes(5));
            return true;
        }

        return false;
    }
}
