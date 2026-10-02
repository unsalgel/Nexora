namespace Nexora.Application.Abstractions;

public interface IAiChatService
{
    Task<string> GenerateResponseAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken = default);
}
