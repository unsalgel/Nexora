using FluentAssertions;
using Nexora.Domain.Exceptions;
using Nexora.Infrastructure.Services;
using StackExchange.Redis;

namespace Nexora.UnitTests.Integration;

public sealed class RedisFactAttribute : FactAttribute
{
    public RedisFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("NEXORA_TEST_REDIS")))
            Skip = "İzole Redis test sunucusu için NEXORA_TEST_REDIS tanımlanmalıdır.";
    }
}

[Trait("Category", "Integration")]
public sealed class LoginRedisTests
{
    [RedisFact]
    public async Task AccountAttemptsAreAtomicAndSharedAcrossIndependentConnections()
    {
        var options = ConfigurationOptions.Parse(Environment.GetEnvironmentVariable("NEXORA_TEST_REDIS")!);
        using var firstConnection = await ConnectionMultiplexer.ConnectAsync(options);
        using var secondConnection = await ConnectionMultiplexer.ConnectAsync(options);
        var first = new LoginAttemptService(firstConnection); var second = new LoginAttemptService(secondConnection);
        // Yalnız bu testin ürettiği alıcı key'leri yazılır ve finally'de temizlenir.
        var email = $"nexora-review-test-{Guid.NewGuid():N}@example.test";
        try
        {
            await Task.WhenAll(Enumerable.Range(0, 5).Select(i => (i % 2 == 0 ? first : second)
                .RecordFailedAttemptAsync(email, "127.0.0.1")));
            await Assert.ThrowsAsync<TooManyRequestsException>(() => first.CheckAttemptAsync(email));
            await Assert.ThrowsAsync<TooManyRequestsException>(() => second.CheckAttemptAsync(email.ToUpperInvariant()));
            var history = await second.ResetAndGetAttemptsAsync(email);
            history.Should().HaveCount(5);
            await first.CheckAttemptAsync(email);
            (await first.ResetAndGetAttemptsAsync(email)).Should().BeEmpty();
        }
        finally { await first.ResetAndGetAttemptsAsync(email); }
    }
}
