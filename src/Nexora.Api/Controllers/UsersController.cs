using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Users.Commands.UpdateProfile;
using Nexora.Application.Features.Users.Commands.UpdateUserRoles;
using Nexora.Application.Features.Users.Commands.UpdateUserStatus;
using Nexora.Application.Features.Users.Dtos;
using Nexora.Application.Features.Users.Queries.GetAllRoles;
using Nexora.Application.Features.Users.Queries.GetProfile;
using Nexora.Application.Features.Users.Queries.GetUsers;

namespace Nexora.Api.Controllers;

[Authorize]
public sealed class UsersController : ApiControllerBase
{
    [HttpGet("me")]
    public async Task<ActionResult<Result<UserProfileDto>>> GetProfile(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new GetProfileQuery(userId), cancellationToken);
        return Ok(result);
    }

    [HttpPut("me")]
    public async Task<ActionResult<Result<UserProfileDto>>> UpdateProfile(
        UpdateProfileCommand command,
        CancellationToken cancellationToken = default)
    {
        var safeCommand = command with { UserId = GetCurrentUserId() };
        var result = await Sender.Send(safeCommand, cancellationToken);
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
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
        UpdateUserStatusCommand command,
        CancellationToken cancellationToken = default)
    {
        var safeCommand = command with { Id = id };
        var result = await Sender.Send(safeCommand, cancellationToken);
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
