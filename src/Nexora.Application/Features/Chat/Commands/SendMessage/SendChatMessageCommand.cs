using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Chat.Dtos;

namespace Nexora.Application.Features.Chat.Commands.SendMessage;

/// <summary>
/// Müşterinin gönderdiği anlık mesajı ve konuşma geçmişini taşıyan CQRS Komutu.
/// MediatR üzerinden işlenerek geriye Result<ChatResponseDto> döner.
/// </summary>
public sealed record SendChatMessageCommand(
    string Message, 
    List<ChatMessageItemDto>? History = null) : IRequest<Result<ChatResponseDto>>;
