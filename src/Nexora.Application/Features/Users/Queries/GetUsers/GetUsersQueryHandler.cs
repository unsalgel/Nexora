using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Users.Dtos;

namespace Nexora.Application.Features.Users.Queries.GetUsers;

public sealed class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, Result<PagedResult<UserDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetUsersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PagedResult<UserDto>>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Users
            .AsNoTracking()
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var search = request.SearchTerm.Trim().ToLower();
            query = query.Where(u =>
                u.FirstName.ToLower().Contains(search.ToLower()) ||
                u.LastName.ToLower().Contains(search.ToLower()) ||
                u.Email.ToLower().Contains(search.ToLower()));
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(u => u.IsActive == request.IsActive.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var users = await query
            .OrderByDescending(u => u.CreatedAtUtc)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.IsActive,
                Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList(),
                OrderCount = _context.Orders.Count(o => o.UserId == u.Id),
                u.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);

        var items = users.Select(u => new UserDto(
            u.Id,
            u.FirstName,
            u.LastName,
            u.Email,
            u.IsActive,
            u.Roles,
            u.OrderCount,
            u.CreatedAtUtc
        )).ToList();

        var pagedResult = new PagedResult<UserDto>(items, request.Page, request.PageSize, totalCount);

        return Result<PagedResult<UserDto>>.Success(pagedResult);
    }
}
