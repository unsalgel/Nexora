using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Users.Commands.UpdateUserRoles;

public sealed class UpdateUserRolesCommandHandler : IRequestHandler<UpdateUserRolesCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public UpdateUserRolesCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(UpdateUserRolesCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException("Kullanıcı bulunamadı.");

        var allRoles = await _context.Roles
            .Where(r => request.Roles.Contains(r.Name))
            .ToListAsync(cancellationToken);

        var isAdminCurrently = user.UserRoles.Any(ur => ur.Role != null && ur.Role.Name == "Admin");
        var willBeAdmin = allRoles.Any(r => r.Name == "Admin");

        if (isAdminCurrently && !willBeAdmin)
        {
            var otherActiveAdminsCount = await _context.UserRoles
                .CountAsync(ur => ur.Role.Name == "Admin" && ur.UserId != user.Id && ur.User.IsActive, cancellationToken);

            if (otherActiveAdminsCount == 0)
            {
                throw new ConflictException("Sistemdeki son aktif yöneticinin yönetici yetkisi kaldırılamaz.");
            }
        }

        _context.UserRoles.RemoveRange(user.UserRoles);
        user.UserRoles.Clear();

        foreach (var role in allRoles)
        {
            user.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = role.Id
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true, "Kullanıcı rolleri başarıyla güncellendi.");
    }
}
