using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Auth.Dtos;
using Nexora.Domain.Exceptions;
using StackExchange.Redis;

namespace Nexora.Infrastructure.Services;

public sealed class LoginAttemptService(IConnectionMultiplexer redis) : ILoginAttemptService
{
    private IDatabase Database => redis.GetDatabase();
    private static string Key(string email) => "login_attempt:{" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(email.Trim().ToLowerInvariant()))) + "}";
    public async Task CheckAttemptAsync(string email, CancellationToken ct = default)
    {
        try
        {
            var until = await Database.HashGetAsync(Key(email), "until").WaitAsync(ct);
            if (until.TryParse(out long milliseconds) && milliseconds > DateTimeOffset.UtcNow.ToUnixTimeMilliseconds())
                throw new TooManyRequestsException("Hesabınız geçici olarak korumaya alınmıştır. Lütfen daha sonra tekrar deneyiniz.");
        }
        catch (RedisException) { throw new SecurityStateUnavailableException(); }
    }
    public async Task RecordFailedAttemptAsync(string email, string? ipAddress, CancellationToken ct = default)
    {
        const string script = """
            local n=redis.call('HINCRBY',KEYS[1],'count',1)
            local seconds=0
            if n>=10 then seconds=86400 elseif n>=8 then seconds=1800 elseif n==7 then seconds=900 elseif n==6 then seconds=300 elseif n==5 then seconds=60 end
            if seconds>0 then redis.call('HSET',KEYS[1],'until',ARGV[1]+seconds*1000) end
            redis.call('EXPIRE',KEYS[1],172800)
            redis.call('LPUSH',KEYS[2],ARGV[2])
            redis.call('LTRIM',KEYS[2],0,19)
            redis.call('EXPIRE',KEYS[2],172800)
            return n
            """;
        try
        {
            var key = Key(email);
            await Database.ScriptEvaluateAsync(script, [key, key + ":details"],
                [DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), JsonSerializer.Serialize(new FailedLoginAttemptDto(DateTime.UtcNow, ipAddress))]).WaitAsync(ct);
        }
        catch (RedisException) { throw new SecurityStateUnavailableException(); }
    }
    public async Task<List<FailedLoginAttemptDto>> ResetAndGetAttemptsAsync(string email, CancellationToken ct = default)
    {
        try
        {
            var key = Key(email);
            var result = await Database.ScriptEvaluateAsync("local details=redis.call('LRANGE',KEYS[2],0,-1); redis.call('DEL',KEYS[1],KEYS[2]); return details", [key, key + ":details"]).WaitAsync(ct);
            return ((RedisResult[]?)result ?? []).Select(v => JsonSerializer.Deserialize<FailedLoginAttemptDto>((string)v!)!).Reverse().ToList();
        }
        catch (RedisException) { throw new SecurityStateUnavailableException(); }
    }
}