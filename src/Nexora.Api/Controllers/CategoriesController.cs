using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Categories.Dtos;
using Nexora.Application.Features.Categories.Commands.CreateCategory;
using Nexora.Application.Features.Categories.Commands.DeleteCategory;
using Nexora.Application.Features.Categories.Commands.UpdateCategory;
using Nexora.Application.Features.Categories.Queries.GetCategories;
using Nexora.Application.Features.Categories.Queries.GetCategoryById;

namespace Nexora.Api.Controllers;

public sealed class CategoriesController : ApiControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<Result<List<CategoryDto>>>> GetCategories(
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetCategoriesQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<CategoryDto>>> GetCategoryById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetCategoryByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<Guid>>> CreateCategory(
        CreateCategoryCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetCategoryById), new { id = result.Data }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> UpdateCategory(
        Guid id,
        UpdateCategoryCommand command,
        CancellationToken cancellationToken = default)
    {
        var safeCommand = command with { Id = id };
        var result = await Sender.Send(safeCommand, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> DeleteCategory(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new DeleteCategoryCommand(id), cancellationToken);
        return Ok(result);
    }
}
