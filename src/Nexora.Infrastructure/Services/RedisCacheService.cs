using System.Text.Json;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using StackExchange.Redis;

namespace Nexora.Infrastructure.Services;

public sealed class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer _connectionMultiplexer;
    private readonly IDatabase _database;
    private readonly ILogger<RedisCacheService> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public RedisCacheService(IConnectionMultiplexer connectionMultiplexer, ILogger<RedisCacheService> logger)
    {
        _connectionMultiplexer = connectionMultiplexer;
        _database = connectionMultiplexer.GetDatabase();
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            RedisValue cachedData = await _database.StringGetAsync(key);
            if (cachedData.IsNullOrEmpty)
            {
                return default;
            }

            return JsonSerializer.Deserialize<T>(cachedData.ToString(), JsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis önbellekten okuma hatası oluştu. Key: {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var jsonData = JsonSerializer.Serialize(value, JsonOptions);
            var expiry = expiration ?? TimeSpan.FromMinutes(60);

            await _database.StringSetAsync(key, jsonData, expiry);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis önbelleğe yazma hatası oluştu. Key: {Key}", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            await _database.KeyDeleteAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis önbellek silme hatası oluştu. Key: {Key}", key);
        }
    }

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        try
        {
            var pattern = $"{prefix}*";
            foreach (var endpoint in _connectionMultiplexer.GetEndPoints())
            {
                var server = _connectionMultiplexer.GetServer(endpoint);
                if (!server.IsConnected)
                    continue;

                var keys = server.Keys(pattern: pattern).ToArray();
                if (keys.Length > 0)
                {
                    await _database.KeyDeleteAsync(keys);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis önbellek önek ile silme hatası oluştu. Prefix: {Prefix}", prefix);
        }
    }
}
