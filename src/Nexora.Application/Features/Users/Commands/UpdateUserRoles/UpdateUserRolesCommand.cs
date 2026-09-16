using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Users.Commands.UpdateUserRoles;

public sealed record UpdateUserRolesCommand(
    Guid UserId,
    IReadOnlyList<string> Roles
) : IRequest<Result<bool>>;
