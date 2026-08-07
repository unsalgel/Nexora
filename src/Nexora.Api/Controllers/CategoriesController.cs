using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Categories;
using Nexora.Application.Features.Categories.Commands.CreateCategory;
using Nexora.Application.Features.Categories.Commands.DeleteCategory;
using Nexora.Application.Features.Categories.Commands.UpdateCategory;
using Nexora.Application.Features.Categories.Queries.GetCategories;
using Nexora.Application.Features.Categories.Queries.GetCategoryById;

namespace Nexora.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CategoriesController : ControllerBase
{
    private readonly ISender _sender;

    public CategoriesController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<Result<List<CategoryDto>>>> GetCategories(
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetCategoriesQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<CategoryDto>>> GetCategoryById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetCategoryByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<Guid>>> CreateCategory(
        CreateCategoryCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetCategoryById), new { id = result.Data }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> UpdateCategory(
        Guid id,
        UpdateCategoryCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.Id)
            return BadRequest(Result<string>.Failure("URL'deki ID ile istek gövdesindeki ID uyuşmuyor."));

        var result = await _sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> DeleteCategory(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteCategoryCommand(id), cancellationToken);
        return Ok(result);
    }
}
