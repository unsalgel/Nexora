using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Users.Dtos;

namespace Nexora.Application.Features.Users.Queries.GetAllRoles;

public sealed class GetAllRolesQueryHandler : IRequestHandler<GetAllRolesQuery, Result<IReadOnlyList<RoleDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetAllRolesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<IReadOnlyList<RoleDto>>> Handle(GetAllRolesQuery request, CancellationToken cancellationToken)
    {
        var roles = await _context.Roles
            .AsNoTracking()
            .OrderBy(r => r.Name)
            .Select(r => new RoleDto(r.Id, r.Name))
            .ToListAsync(cancellationToken);

        return Result<IReadOnlyList<RoleDto>>.Success(roles);
    }
}
