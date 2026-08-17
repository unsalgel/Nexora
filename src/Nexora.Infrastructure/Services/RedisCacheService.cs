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
        RedisValue cachedData = await _database.StringGetAsync(key);
        if (cachedData.IsNullOrEmpty)
        {
            return default;
        }

        return JsonSerializer.Deserialize<T>(cachedData.ToString(), JsonOptions);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        var jsonData = JsonSerializer.Serialize(value, JsonOptions);
        var expiry = expiration ?? TimeSpan.FromMinutes(60);

        await _database.StringSetAsync(key, jsonData, expiry);
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        await _database.KeyDeleteAsync(key);
    }

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        var endpoints = _connectionMultiplexer.GetEndPoints();
        var server = _connectionMultiplexer.GetServer(endpoints.First());

        var keys = server.Keys(pattern: $"{prefix}*").ToArray();
        if (keys.Length > 0)
        {
            await _database.KeyDeleteAsync(keys);
        }
    }
}
