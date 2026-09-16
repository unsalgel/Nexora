using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Users.Commands.UpdateUserRoles;
using Nexora.Application.Features.Users.Commands.UpdateUserStatus;
using Nexora.Application.Features.Users.Dtos;
using Nexora.Application.Features.Users.Queries.GetAllRoles;
using Nexora.Application.Features.Users.Queries.GetUsers;

namespace Nexora.Api.Controllers;

[Authorize(Roles = "Admin")]
public sealed class UsersController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<Result<PagedResult<UserDto>>>> GetUsers(
        string? searchTerm,
        bool? isActive,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetUsersQuery(searchTerm, isActive, page, pageSize);
        var result = await Sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("roles")]
    public async Task<ActionResult<Result<IReadOnlyList<RoleDto>>>> GetRoles(
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetAllRolesQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}/status")]
    public async Task<ActionResult<Result<bool>>> UpdateUserStatus(
        Guid id,
        bool isActive,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateUserStatusCommand(id, isActive);
        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}/roles")]
    public async Task<ActionResult<Result<bool>>> UpdateUserRoles(
        Guid id,
        List<string> roles,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateUserRolesCommand(id, roles);
        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }
}
