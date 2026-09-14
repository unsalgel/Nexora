namespace Nexora.Application.Features.Chat.Dtos;

/// <summary>
/// Geçmiş konuşmadaki tek bir mesajı temsil eder.
/// Role: "user" (müşteri) veya "model" (asistan)
/// </summary>
public sealed record ChatMessageItemDto(string Role, string Content);

/// <summary>
/// Chatbot'un istemciye (frontend) döndüğü nihai yanıt modeli.
/// </summary>
public sealed record ChatResponseDto(string Reply, List<string>? SuggestedQuestions = null);
