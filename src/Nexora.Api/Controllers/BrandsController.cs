using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Brands;
using Nexora.Application.Features.Brands.Commands.CreateBrand;
using Nexora.Application.Features.Brands.Commands.DeleteBrand;
using Nexora.Application.Features.Brands.Commands.UpdateBrand;
using Nexora.Application.Features.Brands.Queries.GetBrandById;
using Nexora.Application.Features.Brands.Queries.GetBrands;

namespace Nexora.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class BrandsController : ControllerBase
{
    private readonly ISender _sender;

    public BrandsController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<Result<List<BrandDto>>>> GetBrands(
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetBrandsQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<BrandDto>>> GetBrandById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetBrandByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<Guid>>> CreateBrand(
        CreateBrandCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetBrandById), new { id = result.Data }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> UpdateBrand(
        Guid id,
        UpdateBrandCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.Id)
            return BadRequest(Result<string>.Failure("URL'deki ID ile istek gövdesindeki ID uyuşmuyor."));

        var result = await _sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> DeleteBrand(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteBrandCommand(id), cancellationToken);
        return Ok(result);
    }
}
