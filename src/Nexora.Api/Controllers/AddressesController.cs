using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Addresses.Commands.CreateAddress;
using Nexora.Application.Features.Addresses.Commands.DeleteAddress;
using Nexora.Application.Features.Addresses.Commands.SetDefaultAddress;
using Nexora.Application.Features.Addresses.Dtos;
using Nexora.Application.Features.Addresses.Queries.GetUserAddresses;

namespace Nexora.Api.Controllers;

[Authorize]
public sealed class AddressesController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<Result<List<AddressDto>>>> GetUserAddresses(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var query = new GetUserAddressesQuery(userId);
        var result = await Sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<Result<AddressDto>>> CreateAddress(
        CreateAddressCommand command,
        CancellationToken cancellationToken = default)
    {
        var safeCommand = command with { UserId = GetCurrentUserId() };
        var result = await Sender.Send(safeCommand, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<Result<string>>> DeleteAddress(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var command = new DeleteAddressCommand(id, userId);
        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}/default")]
    public async Task<ActionResult<Result<string>>> SetDefaultAddress(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var command = new SetDefaultAddressCommand(id, userId);
        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }
}
