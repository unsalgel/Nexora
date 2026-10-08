using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Nexora.Application.Abstractions;
using Nexora.Application.Abstractions.BackgroundJobs;
using Nexora.Infrastructure.Authentication;
using Nexora.Infrastructure.BackgroundJobs;
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
        services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));
        services.AddScoped<IEmailService, SmtpEmailService>();

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
        services.AddScoped<ITokenBlacklistService, TokenBlacklistService>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddScoped<IDbLogger, DbLogger>();

        services.AddHttpClient<IAiChatService, AiChatService>();

        // Hangfire Arka Plan İşleri (PostgreSQL Depolama)
        var dbConnectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? throw new InvalidOperationException("DefaultConnection bağlantı dizesi bulunamadı.");

        services.AddHangfire(config =>
        {
            config.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
                  .UseSimpleAssemblyNameTypeSerializer()
                  .UseRecommendedSerializerSettings()
                  .UsePostgreSqlStorage(c => c.UseNpgsqlConnection(dbConnectionString));
        });

        services.AddHangfireServer(options =>
        {
            options.WorkerCount = Math.Max(2, Environment.ProcessorCount);
            options.ServerName = "Nexora-JobServer";
        });

        // Arka plan iş tanımları
        services.AddScoped<ICouponCleanupJob, CouponCleanupJob>();
        services.AddScoped<IOrderCleanupJob, OrderCleanupJob>();
        services.AddScoped<ICartCleanupJob, CartCleanupJob>();

        return services;
    }
}
