using Microsoft.AspNetCore.RateLimiting;
using Nexora.Api;
using Nexora.Application.Common;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Nexora.Api.Middlewares;
using Nexora.Application;
using Nexora.Infrastructure;
using Nexora.Infrastructure.Authentication;
using Nexora.Persistence;
using Serilog;
using Serilog.Events;
using Serilog.Sinks.PostgreSQL;

var builder = WebApplication.CreateBuilder(args);

// CORS Politikası (Frontend Erişimi İçin)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Serilog Yapılandırması (PostgreSQL DB + Günlük Dosya + Konsol)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? string.Empty;

var columnWriters = new Dictionary<string, ColumnWriterBase>
{
    { "message", new RenderedMessageColumnWriter() },
    { "message_template", new MessageTemplateColumnWriter() },
    { "level", new LevelColumnWriter(true, NpgsqlTypes.NpgsqlDbType.Varchar) },
    { "timestamp_utc", new TimestampColumnWriter(NpgsqlTypes.NpgsqlDbType.TimestampTz) },
    { "exception", new ExceptionColumnWriter() },
    { "properties", new LogEventSerializedColumnWriter() }
};

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/nexora-.log", rollingInterval: RollingInterval.Day)
    .WriteTo.PostgreSQL(
        connectionString: connectionString,
        tableName: "Logs",
        columnOptions: columnWriters,
        needAutoCreateTable: true)
    .CreateLogger();

builder.Host.UseSerilog();


builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddPersistence(builder.Configuration);

var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>();

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
        ValidIssuer = jwtSettings?.Issuer,
        ValidAudience = jwtSettings?.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings?.SecretKey ?? string.Empty))
    };
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();


// Brute-force Koruması İçin Hız Sınırlaması (Rate Limiting - Global IP Bazlı)
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

    options.GlobalLimiter = System.Threading.RateLimiting.PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        if (httpContext.Request.Path.StartsWithSegments("/api/auth"))
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

// Swagger Yapılandırması (JWT Yetkilendirme Butonu ile)
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Nexora API", Version = "v1" });

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

var app = builder.Build();

// HTTP İstek Hattı (Pipeline) Yapılandırması
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

app.UseStaticFiles();

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

try
{
    Log.Information("Veritabanı kontrol ediliyor ve tohumlanıyor...");
    await DatabaseSeeder.SeedAsync(app);
    await VariantSeeder.SeedVariantsAsync(app);

    Log.Information("Nexora API Başlatılıyor...");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Nexora API Başlatılırken Kritik Hata Oluştu!");
}
finally
{
    Log.CloseAndFlush();
}








