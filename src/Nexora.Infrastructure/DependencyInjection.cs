using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Nexora.Application.Abstractions;
using Nexora.Infrastructure.Authentication;
using Nexora.Infrastructure.Services;
using StackExchange.Redis;

namespace Nexora.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

        services.AddScoped<IJwtProvider, JwtProvider>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IPaymentService, FakePaymentService>();

        // Redis Configuration
        var redisConnectionString = configuration.GetConnectionString("Redis") ?? "localhost:6379";
        
        services.AddSingleton<IConnectionMultiplexer>(sp =>
            ConnectionMultiplexer.Connect(redisConnectionString));

        services.AddMemoryCache();
        services.AddSingleton<ILoginAttemptService, LoginAttemptService>();
        services.AddScoped<ICacheService, RedisCacheService>();

        return services;
    }
}
