using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Users.Dtos;

namespace Nexora.Application.Features.Users.Queries.GetAllRoles;

public sealed record GetAllRolesQuery : IRequest<Result<IReadOnlyList<RoleDto>>>;
