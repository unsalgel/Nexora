using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;

namespace Nexora.Infrastructure.Services;

public sealed class AiChatService : IAiChatService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AiChatService> _logger;
    private readonly string? _apiKey;
    private readonly string _endpoint;

    public AiChatService(HttpClient httpClient, IConfiguration configuration, ILogger<AiChatService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        _apiKey = configuration["AiSettings:ApiKey"]
                  ?? configuration["AI_API_KEY"]
                  ?? Environment.GetEnvironmentVariable("AI_API_KEY");

        var model = configuration["AiSettings:Model"]
                    ?? Environment.GetEnvironmentVariable("AI_MODEL")
                    ?? "gemini-3.1-flash-lite";

        _endpoint = configuration["AiSettings:Endpoint"]
                    ?? Environment.GetEnvironmentVariable("AI_ENDPOINT")
                    ?? $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent";
    }

    public async Task<string> GenerateResponseAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken = default)
    {
        var isLocalEndpoint = _endpoint.Contains("localhost", StringComparison.OrdinalIgnoreCase) ||
                              _endpoint.Contains("127.0.0.1", StringComparison.OrdinalIgnoreCase);

        if (!isLocalEndpoint && string.IsNullOrWhiteSpace(_apiKey))
        {
            return "Nexora Asistan şu anda yapılandırılma aşamasındadır (AI API anahtarı henüz tanımlanmamış).";
        }

        var requestUri = !string.IsNullOrWhiteSpace(_apiKey)
            ? $"{_endpoint}?key={_apiKey}"
            : _endpoint;

        var requestBody = new
        {
            systemInstruction = new
            {
                parts = new[]
                {
                    new { text = systemPrompt }
                }
            },
            contents = new[]
            {
                new
                {
                    role = "user",
                    parts = new[]
                    {
                        new { text = userPrompt }
                    }
                }
            },
            generationConfig = new
            {
                temperature = 0.3,
                maxOutputTokens = 800
            }
        };

        // Otomatik Yeniden Deneme (Retry): Google sunucusu 503 veya geçici aşırı yoğunluk verdiğinde 1s bekleyip tekrar dener
        const int maxAttempts = 3;
        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync(requestUri, requestBody, cancellationToken);

                if (response.IsSuccessStatusCode)
                {
                    var apiResponse = await response.Content.ReadFromJsonAsync<AiApiResponse>(cancellationToken: cancellationToken);
                    var textPart = apiResponse?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;

                    if (!string.IsNullOrWhiteSpace(textPart))
                    {
                        return textPart.Trim();
                    }
                }
                else
                {
                    var statusCode = (int)response.StatusCode;
                    var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogWarning("Gemini API hata döndürdü. Deneme: {Attempt}/{MaxAttempts}, Durum: {StatusCode}, Hata: {Error}", attempt, maxAttempts, statusCode, errorContent);

                    // 503 Service Unavailable veya 429 Too Many Requests durumunda kısa bekleme ve tekrar deneme
                    if ((statusCode == 503 || statusCode == 429 || statusCode >= 500) && attempt < maxAttempts)
                    {
                        await Task.Delay(1000 * attempt, cancellationToken);
                        continue;
                    }
                }
            }
            catch (Exception ex) when (attempt < maxAttempts)
            {
                _logger.LogWarning(ex, "Gemini API bağlantı hatası. Yeniden deneniyor... Deneme: {Attempt}/{MaxAttempts}", attempt, maxAttempts);
                await Task.Delay(800 * attempt, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Gemini API tüm denemelere rağmen yanıt veremedi.");
            }
        }

        return "Şu anda yapay zeka servisinde anlık bir yoğunluk yaşanıyor. Sorunuzu yanıtlayamadım ancak ürünlerimizle ilgili bilgi almak isterseniz yukarıdaki hazır seçenekleri kullanabilirsiniz.";
    }

    private sealed record AiApiResponse([property: JsonPropertyName("candidates")] List<Candidate>? Candidates);
    private sealed record Candidate([property: JsonPropertyName("content")] Content? Content);
    private sealed record Content([property: JsonPropertyName("parts")] List<Part>? Parts);
    private sealed record Part([property: JsonPropertyName("text")] string? Text);
}
