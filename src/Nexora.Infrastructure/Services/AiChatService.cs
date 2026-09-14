using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Nexora.Application.Abstractions;

namespace Nexora.Infrastructure.Services;

public sealed class AiChatService : IAiChatService
{
    private readonly HttpClient _httpClient;
    private readonly string? _apiKey;
    private readonly string _endpoint;

    public AiChatService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;

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

        try
        {
            var requestUri = !string.IsNullOrWhiteSpace(_apiKey)
                ? string.Format("{0}?key={1}", _endpoint, _apiKey)
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

            var response = await _httpClient.PostAsJsonAsync(requestUri, requestBody, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                return "Şu anda yardımcı olamıyorum, lütfen daha sonra tekrar deneyin.";
            }

            var apiResponse = await response.Content.ReadFromJsonAsync<AiApiResponse>(cancellationToken: cancellationToken);
            var textPart = apiResponse?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;

            return !string.IsNullOrWhiteSpace(textPart)
                ? textPart.Trim()
                : "Üzgünüm, şu an yanıt oluşturulamadı.";
        }
        catch (Exception)
        {
            return "Yapay zeka servisine bağlanırken bir sorun oluştu. Lütfen biraz sonra tekrar deneyin.";
        }
    }

    private sealed record AiApiResponse([property: JsonPropertyName("candidates")] List<Candidate>? Candidates);
    private sealed record Candidate([property: JsonPropertyName("content")] Content? Content);
    private sealed record Content([property: JsonPropertyName("parts")] List<Part>? Parts);
    private sealed record Part([property: JsonPropertyName("text")] string? Text);
}