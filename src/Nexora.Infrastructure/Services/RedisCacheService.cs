using System.Text.Json;
using Nexora.Application.Abstractions;
using StackExchange.Redis;

namespace Nexora.Infrastructure.Services;

public sealed class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer _connectionMultiplexer;
    private readonly IDatabase _database;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public RedisCacheService(IConnectionMultiplexer connectionMultiplexer)
    {
        _connectionMultiplexer = connectionMultiplexer;
        _database = connectionMultiplexer.GetDatabase();
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
        catch
        {
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
        catch
        {
            // Cache write failure should not break the app
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            await _database.KeyDeleteAsync(key);
        }
        catch
        {
        }
    }

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        try
        {
            foreach (var endpoint in _connectionMultiplexer.GetEndPoints())
            {
                var server = _connectionMultiplexer.GetServer(endpoint);
                var keys = server.Keys(pattern: $"*{prefix}*").ToArray();
                if (keys.Length > 0)
                {
                    await _database.KeyDeleteAsync(keys);
                }
            }
        }
        catch
        {
        }
    }
}
