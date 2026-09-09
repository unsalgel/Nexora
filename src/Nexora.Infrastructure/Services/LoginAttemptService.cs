using Microsoft.Extensions.Caching.Memory;
using Nexora.Application.Abstractions;
using Nexora.Domain.Exceptions;

namespace Nexora.Infrastructure.Services;

public sealed class LoginAttemptService : ILoginAttemptService
{
    private readonly IMemoryCache _memoryCache;
    private static readonly object Lock = new();

    public LoginAttemptService(IMemoryCache memoryCache)
    {
        _memoryCache = memoryCache;
    }

    private sealed class AttemptState
    {
        public int FailedCount { get; set; }
        public DateTime? LockedUntilUtc { get; set; }
    }

    private static string GetCacheKey(string email) => $"login_attempt:{email.Trim().ToLowerInvariant()}";

    public Task CheckAttemptAsync(string email, CancellationToken cancellationToken = default)
    {
        var key = GetCacheKey(email);

        if (_memoryCache.TryGetValue<AttemptState>(key, out var state) && state != null)
        {
            if (state.LockedUntilUtc.HasValue && state.LockedUntilUtc.Value > DateTime.UtcNow)
            {
                var remaining = state.LockedUntilUtc.Value - DateTime.UtcNow;
                string timeStr;

                if (remaining.TotalDays >= 1)
                {
                    var hours = (int)Math.Ceiling(remaining.TotalHours);
                    timeStr = hours > 24 ? "1 gün" : $"{hours} saat";
                }
                else if (remaining.TotalHours >= 1)
                {
                    var hours = (int)Math.Ceiling(remaining.TotalHours);
                    timeStr = $"{hours} saat";
                }
                else if (remaining.TotalMinutes >= 1)
                {
                    var minutes = (int)Math.Ceiling(remaining.TotalMinutes);
                    timeStr = $"{minutes} dakika";
                }
                else
                {
                    var seconds = (int)Math.Ceiling(remaining.TotalSeconds);
                    timeStr = $"{seconds} saniye";
                }

                throw new TooManyRequestsException(
                    $"Çok fazla başarısız şifre denemesi yaptınız. Güvenliğiniz için lütfen {timeStr} sonra tekrar deneyiniz.");
            }
        }

        return Task.CompletedTask;
    }

    public Task RecordFailedAttemptAsync(string email, CancellationToken cancellationToken = default)
    {
        var key = GetCacheKey(email);

        lock (Lock)
        {
            if (!_memoryCache.TryGetValue<AttemptState>(key, out var state) || state == null)
            {
                state = new AttemptState { FailedCount = 0 };
            }

            state.FailedCount++;

            // Kademeli Katlamalı (Exponential) Kilitleme Mantığı:
            // 1-4 deneme: Uyarı verilir, kilitlenmez
            // 5. deneme: 1 Dakika
            // 6. deneme: 5 Dakika
            // 7. deneme: 15 Dakika
            // 8-9. deneme: 30 Dakika
            // 10+ deneme: 1 Gün (24 Saat)
            TimeSpan? lockDuration = state.FailedCount switch
            {
                >= 10 => TimeSpan.FromDays(1),
                >= 8 => TimeSpan.FromMinutes(30),
                7 => TimeSpan.FromMinutes(15),
                6 => TimeSpan.FromMinutes(5),
                5 => TimeSpan.FromMinutes(1),
                _ => null
            };

            if (lockDuration.HasValue)
            {
                state.LockedUntilUtc = DateTime.UtcNow.Add(lockDuration.Value);
            }

            // Hafızada son başarısızlıktan itibaren 48 saat saklanır
            _memoryCache.Set(key, state, TimeSpan.FromDays(2));
        }

        return Task.CompletedTask;
    }

    public Task ResetAttemptsAsync(string email, CancellationToken cancellationToken = default)
    {
        var key = GetCacheKey(email);
        _memoryCache.Remove(key);
        return Task.CompletedTask;
    }
}
