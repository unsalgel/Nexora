using Hangfire;
using Microsoft.AspNetCore.DataProtection;
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
        services.Configure<JwtSettings>(options =>
        {
            configuration.GetSection(JwtSettings.SectionName).Bind(options);
            var envSecret = configuration["JWT_SECRET_KEY"] ?? Environment.GetEnvironmentVariable("JWT_SECRET_KEY");
            if (!string.IsNullOrWhiteSpace(envSecret))
            {
                options.SecretKey = envSecret;
            }
        });
        services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));
        services.AddDataProtection().SetApplicationName("Nexora").PersistKeysToFileSystem(new DirectoryInfo(
            configuration["DataProtection:KeysPath"] ?? Path.Combine(AppContext.BaseDirectory, "data", "keys")));
        services.AddScoped<SmtpEmailService>();
        services.AddScoped<IEmailService, HangfireEmailService>();

        services.AddScoped<IJwtProvider, JwtProvider>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IPaymentService, FakePaymentService>();

        // Native config binding korunur; açık environment override bağlantıdaki varsayılandan önceliklidir.
        var redisConnectionString = configuration["REDIS_URL"] ?? configuration.GetConnectionString("Redis")
            ?? "localhost:6379,abortConnect=false";
        var redisOptions = ConfigurationOptions.Parse(redisConnectionString);
        var redisPassword = configuration["REDIS_PASSWORD"];
        if (!string.IsNullOrWhiteSpace(redisPassword)) redisOptions.Password = redisPassword;
        services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(redisOptions));
        services.AddMemoryCache();
        services.AddSingleton<ILoginAttemptService, LoginAttemptService>();
        services.AddScoped<ICacheService, RedisCacheService>();
        services.AddScoped<IAuthTokenProtector, AuthTokenProtector>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddScoped<IDbLogger, DbLogger>();

        services.AddHttpClient<IAiChatService, AiChatService>(client => client.Timeout = TimeSpan.FromSeconds(30));

        // Hangfire Arka Plan İşleri (PostgreSQL Depolama)
        var dbConnectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? throw new InvalidOperationException("DefaultConnection bağlantı dizesi bulunamadı.");

        services.AddHangfire(config =>
        {
            config.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
                  .UseSimpleAssemblyNameTypeSerializer()
                  .UseRecommendedSerializerSettings()
                  .UsePostgreSqlStorage(c => c.UseNpgsqlConnection(dbConnectionString), new PostgreSqlStorageOptions
                  {
                      PrepareSchemaIfNecessary = configuration.GetValue("Hangfire:PrepareSchema", true)
                  });
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
        services.AddScoped<EmailOutboxDispatchJob>();
        services.AddScoped<FileCleanupJob>();
        services.AddScoped<AuthCleanupJob>();

        return services;
    }
}
