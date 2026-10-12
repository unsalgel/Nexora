using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Features.ProductAttributes;

namespace Nexora.Api.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/v{version:apiVersion}/product-attributes")]
public sealed class ProductAttributesController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct) => Ok(await Sender.Send(new GetAttributesQuery(), ct));
    [HttpPost]
    public async Task<IActionResult> Create(SaveAttributeCommand command, CancellationToken ct) => Ok(await Sender.Send(command with { Id = null }, ct));
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, SaveAttributeCommand command, CancellationToken ct) => Ok(await Sender.Send(command with { Id = id }, ct));
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) => Ok(await Sender.Send(new DeleteAttributeCommand(id), ct));
    [HttpPost("{attributeId:guid}/values")]
    public async Task<IActionResult> CreateValue(Guid attributeId, SaveAttributeValueCommand command, CancellationToken ct) => Ok(await Sender.Send(command with { AttributeId = attributeId, Id = null }, ct));
    [HttpPut("{attributeId:guid}/values/{id:guid}")]
    public async Task<IActionResult> UpdateValue(Guid attributeId, Guid id, SaveAttributeValueCommand command, CancellationToken ct) => Ok(await Sender.Send(command with { AttributeId = attributeId, Id = id }, ct));
    [HttpDelete("values/{id:guid}")]
    public async Task<IActionResult> DeleteValue(Guid id, CancellationToken ct) => Ok(await Sender.Send(new DeleteAttributeValueCommand(id), ct));
}
