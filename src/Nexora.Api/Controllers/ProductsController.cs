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

public sealed class ProductsController : ApiControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<Result<PagedResult<ProductListDto>>>> GetProducts(
        int page = 1,
        int pageSize = 20,
        Guid? categoryId = null,
        Guid? brandId = null,
        string? searchTerm = null,
        bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var filterIsActive = IsAdmin ? isActive : true;
        var query = new GetProductsQuery(page, pageSize, categoryId, brandId, searchTerm, filterIsActive);
        var result = await Sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<ProductDto>>> GetProductById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetProductByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<Guid>>> CreateProduct(
        CreateProductCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetProductById), new { id = result.Data }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> UpdateProduct(
        Guid id,
        UpdateProductCommand command,
        CancellationToken cancellationToken = default)
    {
        var safeCommand = command with { Id = id };
        var result = await Sender.Send(safeCommand, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> DeleteProduct(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new DeleteProductCommand(id), cancellationToken);
        return Ok(result);
    }

    [HttpPost("images/upload")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> UploadImage(
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        using var stream = file.OpenReadStream();
        var command = new Nexora.Application.Features.Products.Commands.UploadProductImage.UploadProductImageCommand(
            stream,
            file.FileName,
            file.ContentType);

        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/images")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<Guid>>> AddProductImage(
        Guid id,
        AddProductImageCommand command,
        CancellationToken cancellationToken = default)
    {
        var safeCommand = command with { ProductId = id };
        var result = await Sender.Send(safeCommand, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpDelete("{id:guid}/images/{imageId:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> DeleteProductImage(
        Guid id,
        Guid imageId,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new DeleteProductImageCommand(id, imageId), cancellationToken);
        return Ok(result);
    }
}
