using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Products.Commands.AddProductImage;
using Nexora.Application.Features.Products.Commands.CreateProduct;
using Nexora.Application.Features.Products.Commands.DeleteProduct;
using Nexora.Application.Features.Products.Commands.DeleteProductImage;
using Nexora.Application.Features.Products.Commands.UpdateProduct;
using Nexora.Application.Features.Products.Dtos;
using Nexora.Application.Features.Products.Queries.GetProductById;
using Nexora.Application.Features.Products.Queries.GetProducts;

namespace Nexora.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ProductsController : ControllerBase
{
    private readonly ISender _sender;

    public ProductsController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<Result<PagedResult<ProductListDto>>>> GetProducts(
        [FromQuery] GetProductsQuery query,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<ProductDto>>> GetProductById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetProductByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<Guid>>> CreateProduct(
        CreateProductCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetProductById), new { id = result.Data }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> UpdateProduct(
        Guid id,
        UpdateProductCommand command,
        CancellationToken cancellationToken)
    {
        var safeCommand = command with { Id = id };
        var result = await _sender.Send(safeCommand, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> DeleteProduct(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteProductCommand(id), cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/images")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<Guid>>> AddProductImage(
        Guid id,
        AddProductImageCommand command,
        CancellationToken cancellationToken)
    {
        var safeCommand = command with { ProductId = id };
        var result = await _sender.Send(safeCommand, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:guid}/images/{imageId:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> DeleteProductImage(
        Guid id,
        Guid imageId,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteProductImageCommand(id, imageId), cancellationToken);
        return Ok(result);
    }
}
