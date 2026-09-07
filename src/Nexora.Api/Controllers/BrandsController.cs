using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Brands.Dtos;
using Nexora.Application.Features.Brands.Commands.CreateBrand;
using Nexora.Application.Features.Brands.Commands.DeleteBrand;
using Nexora.Application.Features.Brands.Commands.UpdateBrand;
using Nexora.Application.Features.Brands.Queries.GetBrandById;
using Nexora.Application.Features.Brands.Queries.GetBrands;

namespace Nexora.Api.Controllers;

public sealed class BrandsController : ApiControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<Result<List<BrandDto>>>> GetBrands(
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetBrandsQuery(isActive), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<BrandDto>>> GetBrandById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetBrandByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<Guid>>> CreateBrand(
        CreateBrandCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetBrandById), new { id = result.Data }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> UpdateBrand(
        Guid id,
        UpdateBrandCommand command,
        CancellationToken cancellationToken = default)
    {
        var safeCommand = command with { Id = id };
        var result = await Sender.Send(safeCommand, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> DeleteBrand(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new DeleteBrandCommand(id), cancellationToken);
        return Ok(result);
    }
}
