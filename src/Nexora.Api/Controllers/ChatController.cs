using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Chat.Commands.SendMessage;
using Nexora.Application.Features.Chat.Dtos;

namespace Nexora.Api.Controllers;

/// <summary>
/// Müşteri destek yapay zeka asistanı (AI Chatbot) API uç noktalarını yöneten Controller.
/// Ziyaretçiler veya giriş yapmış kullanıcılar soru sorabilir.
/// </summary>
[AllowAnonymous]
public sealed class ChatController : ApiControllerBase
{
    /// <summary>
    /// AI Chatbot'a mesaj gönderir ve RAG tabanlı dinamik yanıt alır.
    /// </summary>
    [HttpPost("send")]
    public async Task<ActionResult<Result<ChatResponseDto>>> SendMessage(
        SendChatMessageCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }
}
