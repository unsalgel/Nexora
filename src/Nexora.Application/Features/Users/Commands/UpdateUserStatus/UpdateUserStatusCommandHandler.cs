using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;
using Nexora.Application.Features.Auth;

namespace Nexora.Application.Features.Users.Commands.UpdateUserStatus;

public sealed class UpdateUserStatusCommandHandler : IRequestHandler<UpdateUserStatusCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly IRealTimeNotificationService? _notificationService;

    public UpdateUserStatusCommandHandler(
        IApplicationDbContext context,
        IRealTimeNotificationService? notificationService = null)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<Result<bool>> Handle(UpdateUserStatusCommand request, CancellationToken cancellationToken)
    {
        await using var transaction = await _context.BeginTransactionAsync("auth-admin", cancellationToken);
        await transaction.AcquireLockAsync($"auth:{request.Id}", cancellationToken);
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Kullanıcı bulunamadı.");

        if (!request.IsActive)
        {
            var isUserAdmin = await _context.UserRoles
                .AnyAsync(ur => ur.UserId == user.Id && ur.Role != null && ur.Role.Name == "Admin", cancellationToken);

            if (isUserAdmin)
            {
                var otherActiveAdminsCount = await _context.UserRoles
                    .CountAsync(ur => ur.Role.Name == "Admin" && ur.UserId != user.Id && ur.User.IsActive, cancellationToken);

                if (otherActiveAdminsCount == 0)
                {
                    throw new ConflictException("Sistemdeki son aktif yönetici dondurulamaz.");
                }
            }

            user.IsActive = false;
        }
        else
        {
            user.IsActive = true;
        }

        await _context.InvalidateSessionsAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        if (_notificationService is not null)
            await _notificationService.PublishToUserAsync(user.Id, request.IsActive ? "SessionRevoked" : "AccountFrozen",
                new { message = "Hesap durumunuz değişti. Lütfen yeniden giriş yapın." }, cancellationToken);

        return Result<bool>.Success(true, request.IsActive ? "Kullanıcı hesabı aktif duruma getirildi." : "Kullanıcı hesabı donduruldu/pasife alındı.");
    }
}
