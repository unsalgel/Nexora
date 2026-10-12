using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Application.Features.Auth;

namespace Nexora.Application.Features.Users.Commands.UpdateUserRoles;

public sealed class UpdateUserRolesCommandHandler : IRequestHandler<UpdateUserRolesCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly IRealTimeNotificationService? _notifications;

    public UpdateUserRolesCommandHandler(
        IApplicationDbContext context,
        IRealTimeNotificationService? notifications = null)
    {
        _context = context;
        _notifications = notifications;
    }

    public async Task<Result<bool>> Handle(UpdateUserRolesCommand request, CancellationToken cancellationToken)
    {
        await using var transaction = await _context.BeginTransactionAsync("auth-admin", cancellationToken);
        await transaction.AcquireLockAsync($"auth:{request.UserId}", cancellationToken);
        if (request.Roles is null || request.Roles.Count == 0 || request.Roles.Any(string.IsNullOrWhiteSpace) || request.Roles.Distinct(StringComparer.Ordinal).Count() != request.Roles.Count)
            throw new BusinessValidationException("En az bir geçerli ve benzersiz rol seçilmelidir.");
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException("Kullanıcı bulunamadı.");

        var allRoles = await _context.Roles
            .Where(r => request.Roles.Contains(r.Name))
            .ToListAsync(cancellationToken);

        var isAdminCurrently = user.UserRoles.Any(ur => ur.Role != null && ur.Role.Name == "Admin");
        if (allRoles.Count != request.Roles.Count) throw new BusinessValidationException("Bilinmeyen rol adı.");
        var willBeAdmin = allRoles.Any(r => r.Name == "Admin");

        if (isAdminCurrently && !willBeAdmin)
        {
            var otherActiveAdminsCount = await _context.UserRoles
                .CountAsync(ur => ur.Role.Name == "Admin" && ur.UserId != user.Id && ur.User.IsActive && ur.User.IsEmailConfirmed, cancellationToken);

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

        await _context.InvalidateSessionsAsync(user, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        if (_notifications is not null)
            await _notifications.PublishToUserAsync(user.Id, "SessionRevoked", new { message = "Yetkileriniz değişti. Lütfen yeniden giriş yapın." }, cancellationToken);

        return Result<bool>.Success(true, "Kullanıcı rolleri başarıyla güncellendi.");
    }
}
