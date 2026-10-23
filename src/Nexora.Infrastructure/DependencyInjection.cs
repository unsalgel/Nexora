using Hangfire;
using Microsoft.Extensions.Hosting;
using Nexora.Infrastructure.Payments;
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
        services.Configure<Nexora.Infrastructure.Payments.IyzicoSettings>(options =>
        {
            configuration.GetSection(Nexora.Infrastructure.Payments.IyzicoSettings.SectionName).Bind(options);
            var envApiKey = configuration["IYZICO_API_KEY"] ?? Environment.GetEnvironmentVariable("IYZICO_API_KEY");
            if (!string.IsNullOrWhiteSpace(envApiKey)) options.ApiKey = envApiKey;

            var envSecretKey = configuration["IYZICO_SECRET_KEY"] ?? Environment.GetEnvironmentVariable("IYZICO_SECRET_KEY");
            if (!string.IsNullOrWhiteSpace(envSecretKey)) options.SecretKey = envSecretKey;

            var envBaseUrl = configuration["IYZICO_BASE_URL"] ?? Environment.GetEnvironmentVariable("IYZICO_BASE_URL");
            if (!string.IsNullOrWhiteSpace(envBaseUrl)) options.BaseUrl = envBaseUrl;
            var callbackUrl = configuration["IYZICO_CALLBACK_URL"];
            if (!string.IsNullOrWhiteSpace(callbackUrl)) options.CallbackUrl = callbackUrl;
        });
        services.AddOptions<IyzicoSettings>()
            .Validate<IHostEnvironment>((settings, environment) => IyzicoSettings.IsValidCallback(settings.CallbackUrl, environment.IsDevelopment()),
                "IYZICO_CALLBACK_URL geçerli /api/v1/payments/callback adresi olmalıdır; üretimde genel HTTPS adresi kullanın.")
            .Validate<IHostEnvironment>((settings, environment) => environment.IsDevelopment() ||
                (!string.IsNullOrWhiteSpace(settings.ApiKey) && !string.IsNullOrWhiteSpace(settings.SecretKey)),
                "Üretimde iyzico API anahtarları zorunludur.")
            .Validate(settings => settings.BaseUrl is "https://api.iyzipay.com" or "https://sandbox-api.iyzipay.com",
                "İyzico BaseUrl resmî HTTPS API adresi olmalıdır.")
            .ValidateOnStart();
        services.AddDataProtection().SetApplicationName("Nexora").PersistKeysToFileSystem(new DirectoryInfo(
            configuration["DataProtection:KeysPath"] ?? Path.Combine(AppContext.BaseDirectory, "data", "keys")));
        services.AddScoped<SmtpEmailService>();
        services.AddScoped<IEmailService, HangfireEmailService>();

        services.AddScoped<IJwtProvider, JwtProvider>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IPaymentGateway, Nexora.Infrastructure.Payments.Adapters.IyzicoPaymentAdapter>();

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
        services.AddScoped<PaymentReconciliationJob>();
        services.AddScoped<ICartCleanupJob, CartCleanupJob>();
        services.AddScoped<EmailOutboxDispatchJob>();
        services.AddScoped<FileCleanupJob>();
        services.AddScoped<AuthCleanupJob>();
        services.AddScoped<LogRetentionJob>();

        return services;
    }
}
