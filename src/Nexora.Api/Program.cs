using System.Security.Claims;
using System.Text;
using Asp.Versioning;
using Hangfire;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Nexora.Api;
using Nexora.Api.Filters;
using Nexora.Api.Health;
using Nexora.Api.Hubs;
using Nexora.Api.Middlewares;
using Nexora.Api.OpenApi;
using Nexora.Api.Services;
using Nexora.Application;
using Nexora.Application.Abstractions.BackgroundJobs;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Infrastructure;
using Nexora.Infrastructure.Authentication;
using Nexora.Persistence;
using Nexora.Persistence.Context;
using Serilog;
using Serilog.Events;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("NexoraCorsPolicy", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173", "http://localhost:5174"])
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                ?? ["https://nexora.com", "https://admin.nexora.com"];

            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/nexora-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddPersistence(builder.Configuration);

var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>() ?? new JwtSettings();
var resolvedSecretKey = builder.Configuration["JWT_SECRET_KEY"] 
    ?? Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
    ?? jwtSettings.SecretKey;

if (!builder.Environment.IsDevelopment() &&
    (string.IsNullOrWhiteSpace(resolvedSecretKey) ||
     resolvedSecretKey.Contains("YOUR_JWT_SECRET_KEY") ||
     Encoding.UTF8.GetByteCount(resolvedSecretKey) < 32))
{
    throw new InvalidOperationException("GÜVENLİK HATASI: Canlı ortamda varsayılan veya güvensiz JWT anahtarı kullanılamaz. Lütfen en az 32 karakterlik güvenli bir JWT_SECRET_KEY ortam değişkeni tanımlayınız.");
}

jwtSettings.SecretKey = resolvedSecretKey;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ClockSkew = TimeSpan.Zero,
        ValidIssuer = jwtSettings?.Issuer,
        ValidAudience = jwtSettings?.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings?.SecretKey ?? string.Empty))
    };

    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var validator = context.HttpContext.RequestServices.GetRequiredService<AuthenticationSessionValidator>();
            try
            {
                if (!await validator.IsValidAsync(context.Principal, context.HttpContext.RequestAborted))
                    context.Fail("Bu oturum sonlandırılmıştır. Lütfen yeniden giriş yapın.");
            }
            catch (OperationCanceledException) when (context.HttpContext.RequestAborted.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                context.HttpContext.RequestServices.GetRequiredService<ILogger<AuthenticationSessionValidator>>()
                    .LogWarning(ex, "Oturum doğrulaması tamamlanamadı.");
                context.Fail("Oturum doğrulanamadı.");
            }
        },
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddSignalR();
builder.Services.AddScoped<AuthenticationSessionValidator>();
builder.Services.AddSingleton<HubConnectionRegistry>();
builder.Services.AddHostedService<HubSessionMonitor>();
builder.Services.AddScoped<IRealTimeNotificationService, RealTimeNotificationService>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAuditContext, HttpAuditContext>();
builder.Services.AddScoped<BrowserSession>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        new HeaderApiVersionReader("X-Api-Version"),
        new QueryStringApiVersionReader("api-version")
    );
})
.AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database")
    .AddCheck<Nexora.Api.HealthChecks.RedisHealthCheck>("redis");

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        var response = Result<string>.Failure(
            "Çok fazla başarısız veya ardışık istekte bulundunuz. Lütfen 1 dakika sonra tekrar deneyiniz.");
        await context.HttpContext.Response.WriteAsJsonAsync(response, cancellationToken: token);
    };

    options.AddPolicy("AuthPolicy", httpContext => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
        httpContext.Connection.RemoteIpAddress?.ToString() ?? "anon", _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
        { PermitLimit = 20, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));

    options.AddPolicy("AiChatPolicy", httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "anon";
        return System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            $"chat_{clientIp}",
            _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });

    options.GlobalLimiter = System.Threading.RateLimiting.PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var path = httpContext.Request.Path.Value ?? string.Empty;
        if (path.Contains("/coupons/validate", StringComparison.OrdinalIgnoreCase))
        {
            var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "anon";
            return System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
                clientIp,
                _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
                {
                    PermitLimit = 20,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0
                });
        }

        return System.Threading.RateLimiting.RateLimitPartition.GetNoLimiter("unlimited");
    });
});

builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Token bilginizi 'Bearer {token}' formatında giriniz."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
builder.Services.ConfigureOptions<ConfigureSwaggerOptions>();

var app = builder.Build();

var forwardedHeadersOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
};

forwardedHeadersOptions.KnownNetworks.Clear();
forwardedHeadersOptions.KnownProxies.Clear();
forwardedHeadersOptions.KnownProxies.Add(System.Net.IPAddress.Loopback);
forwardedHeadersOptions.KnownProxies.Add(System.Net.IPAddress.IPv6Loopback);
foreach (var address in builder.Configuration.GetSection("ReverseProxy:KnownProxies").Get<string[]>() ?? [])
{
    if (!System.Net.IPAddress.TryParse(address, out var trustedProxy))
        throw new InvalidOperationException("ReverseProxy:KnownProxies yalnız geçerli IP adresleri içermelidir.");
    if (!forwardedHeadersOptions.KnownProxies.Contains(trustedProxy))
        forwardedHeadersOptions.KnownProxies.Add(trustedProxy);
}

app.UseForwardedHeaders(forwardedHeadersOptions);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        var descriptions = app.DescribeApiVersions();
        foreach (var description in descriptions)
        {
            var url = $"/swagger/{description.GroupName}/swagger.json";
            var name = description.GroupName.ToUpperInvariant();
            options.SwaggerEndpoint(url, name);
        }
    });
}
else
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseCors("NexoraCorsPolicy");
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
app.UseStaticFiles();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    DashboardTitle = "Nexora Hangfire Yönetim Paneli",
    Authorization = [new HangfireDashboardAuthorizationFilter()]
});

app.MapControllers();
app.MapHub<AppHub>("/hubs/app", options => options.CloseOnAuthenticationExpiration = true);

app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false
});

app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => true
});

try
{
    Log.Information("Veritabanı kontrol ediliyor ve tohumlanıyor...");
    await DatabaseSeeder.SeedAsync(app);
    await VariantSeeder.SeedVariantsAsync(app);

    // Hangfire Periyodik Görevlerin (Recurring Jobs) Tanımlanması
    using (var scope = app.Services.CreateScope())
    {
        var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();

        var turkeyTimeZone = TimeZoneInfo.FindSystemTimeZoneById(
            OperatingSystem.IsWindows() ? "Turkey Standard Time" : "Europe/Istanbul");

        var jobOptions = new RecurringJobOptions { TimeZone = turkeyTimeZone };

        recurringJobManager.AddOrUpdate<Nexora.Infrastructure.BackgroundJobs.EmailOutboxDispatchJob>("email-outbox-dispatch", job => job.DispatchAsync(CancellationToken.None), Cron.Minutely, jobOptions);
        recurringJobManager.AddOrUpdate<Nexora.Infrastructure.BackgroundJobs.FileCleanupJob>("file-cleanup", job => job.RunAsync(CancellationToken.None), Cron.Daily, jobOptions);
        recurringJobManager.AddOrUpdate<Nexora.Infrastructure.BackgroundJobs.LogRetentionJob>("log-retention", job => job.RunAsync(CancellationToken.None), Cron.Minutely, jobOptions);
        recurringJobManager.AddOrUpdate<Nexora.Infrastructure.BackgroundJobs.AuthCleanupJob>("auth-cleanup", job => job.RunAsync(CancellationToken.None), Cron.Daily, jobOptions);

        recurringJobManager.AddOrUpdate<ICouponCleanupJob>(
            "coupon-cleanup-job",
            job => job.ProcessExpiredCouponsAsync(CancellationToken.None),
            Cron.Hourly,
            jobOptions);

        recurringJobManager.AddOrUpdate<IOrderCleanupJob>(
            "stale-orders-cleanup-job",
            job => job.CancelStalePendingOrdersAsync(CancellationToken.None),
            "*/30 * * * *",
            jobOptions);

        recurringJobManager.AddOrUpdate<ICartCleanupJob>(
            "cart-cleanup-job",
            job => job.CleanupAbandonedCartsAsync(CancellationToken.None),
            Cron.Daily,
            jobOptions);

        Log.Information("Hangfire periyodik arka plan görevleri Türkiye saatine göre başarıyla zamanlandı.");
    }

    _ = Task.Run(async () =>
    {
        try
        {
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<NexoraDbContext>();
            await db.Products.AsNoTracking().AnyAsync();
            Log.Information("Veritabanı ve EF Core bağlantısı başarıyla ısıtıldı (Warm-up tamamlandı).");
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Warm-up sırasında önemsiz uyarı.");
        }
    });

    Log.Information("Nexora API Başlatılıyor...");
    app.Run();
}
catch (Exception ex)
{
    Environment.ExitCode = 1;
    Log.Fatal(ex, "Nexora API Başlatılırken Kritik Hata Oluştu!");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
