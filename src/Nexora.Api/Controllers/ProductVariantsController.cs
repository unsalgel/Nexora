using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.ProductVariants.Commands.CreateProductVariant;
using Nexora.Application.Features.ProductVariants.Commands.DeleteProductVariant;
using Nexora.Application.Features.ProductVariants.Commands.UpdateProductVariant;
using Nexora.Application.Features.ProductVariants.Dtos;
using Nexora.Application.Features.ProductVariants.Queries.GetProductVariantsByProductId;

namespace Nexora.Api.Controllers;

[Route("api")]
public sealed class ProductVariantsController : ApiControllerBase
{
    [HttpGet("products/{productId:guid}/variants")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<List<ProductVariantDto>>>> GetVariantsByProductId(
        Guid productId,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetProductVariantsByProductIdQuery(productId), cancellationToken);
        return Ok(result);
    }

    [HttpPost("products/{productId:guid}/variants")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<Guid>>> CreateVariant(
        Guid productId,
        CreateProductVariantCommand command,
        CancellationToken cancellationToken = default)
    {
        var safeCommand = command with { ProductId = productId };
        var result = await Sender.Send(safeCommand, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPut("product-variants/{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> UpdateVariant(
        Guid id,
        UpdateProductVariantCommand command,
        CancellationToken cancellationToken = default)
    {
        var safeCommand = command with { Id = id };
        var result = await Sender.Send(safeCommand, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("product-variants/{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> DeleteVariant(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new DeleteProductVariantCommand(id), cancellationToken);
        return Ok(result);
    }
}
