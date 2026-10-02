using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Chat.Dtos;

namespace Nexora.Application.Features.Chat.Commands.SendMessage;


public sealed record SendChatMessageCommand(
    string Message, 
    List<ChatMessageItemDto>? History = null) : IRequest<Result<ChatResponseDto>>;
