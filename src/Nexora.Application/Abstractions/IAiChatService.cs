namespace Nexora.Application.Abstractions;

/// <summary>
/// Yapay zeka sağlayıcısından (Gemini, Ollama, OpenAI vb.) bağımsız,
/// sistem ve kullanıcı prompt'u alarak metin yanıt üreten jenerik servis sözleşmesi.
/// </summary>
public interface IAiChatService
{
    Task<string> GenerateResponseAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken = default);
}
