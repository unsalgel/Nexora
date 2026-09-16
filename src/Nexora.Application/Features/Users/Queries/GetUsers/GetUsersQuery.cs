using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Users.Dtos;

namespace Nexora.Application.Features.Users.Queries.GetUsers;

public sealed record GetUsersQuery(
    string? SearchTerm = null,
    bool? IsActive = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<UserDto>>>;
