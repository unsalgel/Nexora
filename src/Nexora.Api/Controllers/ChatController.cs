using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Chat.Commands.SendMessage;
using Nexora.Application.Features.Chat.Dtos;

namespace Nexora.Api.Controllers;

[AllowAnonymous]
public sealed class ChatController : ApiControllerBase
{
    [HttpPost("send")]
    public async Task<ActionResult<Result<ChatResponseDto>>> SendMessage(
        SendChatMessageCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }
}
