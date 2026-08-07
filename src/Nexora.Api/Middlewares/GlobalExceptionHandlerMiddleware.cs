using System.Text.Json;
using FluentValidation;
using Nexora.Domain.Exceptions;

namespace Nexora.Api.Middlewares;

public sealed class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Bir hata oluştu: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        int statusCode;
        string message;
        List<string>? errors = null;

        switch (exception)
        {
            case ValidationException validationEx:
                statusCode = StatusCodes.Status400BadRequest;
                message = "Doğrulama hatası oluştu.";
                errors = validationEx.Errors.Select(e => e.ErrorMessage).ToList();
                break;

            case DomainException domainEx:
                statusCode = domainEx.StatusCode;
                message = domainEx.Message;
                break;

            default:
                statusCode = StatusCodes.Status500InternalServerError;
                message = "Sunucu tarafında beklenmeyen bir hata oluştu.";
                break;
        }

        context.Response.StatusCode = statusCode;

        var response = new
        {
            isSuccess = false,
            data = (object?)null,
            errors,
            message
        };

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        return context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}
