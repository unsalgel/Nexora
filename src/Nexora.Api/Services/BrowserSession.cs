using Nexora.Application.Common;
using Nexora.Application.Features.Auth.Dtos;
using Nexora.Domain.Exceptions;

namespace Nexora.Api.Services;

public sealed class BrowserSession(IConfiguration configuration, IWebHostEnvironment environment)
{
    public string? Client(HttpRequest request)
    {
        var client = request.Headers["X-Nexora-Client"].ToString();
        if (string.IsNullOrEmpty(client)) return null;
        if (client is not ("web" or "admin")) throw new BusinessValidationException("Geçersiz istemci.");
        var origin = request.Headers.Origin.ToString();
        var allowed = configuration.GetSection($"BrowserSessions:{client}:AllowedOrigins").Get<string[]>() ??
            (environment.IsDevelopment() ? [client == "web" ? "http://localhost:5173" : "http://localhost:5174"] : []);
        if (string.IsNullOrEmpty(origin) || !allowed.Contains(origin, StringComparer.Ordinal))
            throw new UnauthorizedException("İstek kaynağına izin verilmiyor.");
        if (!environment.IsDevelopment() && !request.IsHttps)
            throw new UnauthorizedException("Tarayıcı oturumları HTTPS gerektirir.");
        return client;
    }

    private static string CookieName(string client) => "Nexora." + client + ".Refresh";
    private CookieOptions Options(HttpRequest request) => new()
    {
        HttpOnly = true, Secure = !environment.IsDevelopment() || request.IsHttps,
        SameSite = SameSiteMode.Strict, Path = "/api", IsEssential = true
    };

    public string Read(HttpRequest request, string client) =>
        request.Cookies[CookieName(client)] ?? throw new UnauthorizedException("Oturumunuz sona erdi.");

    public Result<AuthTokenDto> Write(HttpContext context, string? client, Result<AuthTokenDto> result)
    {
        if (client is null || !result.IsSuccess || result.Data is null) return result;
        var options = Options(context.Request);
        options.Expires = result.Data.ExpiresAtUtc;
        context.Response.Cookies.Append(CookieName(client), result.Data.RefreshToken, options);
        context.Response.Headers.CacheControl = "no-store";
        return Result<AuthTokenDto>.Success(result.Data with { RefreshToken = string.Empty }, result.Message);
    }

    public void Clear(HttpContext context, string client) =>
        context.Response.Cookies.Delete(CookieName(client), Options(context.Request));
}
