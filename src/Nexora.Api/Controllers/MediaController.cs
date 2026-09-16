using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Products.Commands.UploadProductImage;

namespace Nexora.Api.Controllers;

[Authorize(Roles = "Admin")]
public sealed class MediaController : ApiControllerBase
{
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<Result<string>>> UploadMedia(
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        using var stream = file.OpenReadStream();
        var command = new UploadProductImageCommand(
            stream,
            file.FileName,
            file.ContentType);

        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }
}
