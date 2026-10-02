namespace Nexora.Application.Features.Chat.Dtos;

public sealed record ChatMessageItemDto(string Role, string Content);

public sealed record ChatResponseDto(string Reply, List<string>? SuggestedQuestions = null);
