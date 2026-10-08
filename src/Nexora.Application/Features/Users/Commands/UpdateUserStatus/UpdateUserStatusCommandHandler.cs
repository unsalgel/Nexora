using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Users.Commands.UpdateUserStatus;

public sealed class UpdateUserStatusCommandHandler : IRequestHandler<UpdateUserStatusCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITokenBlacklistService _tokenBlacklistService;
    private readonly IRealTimeNotificationService? _notificationService;

    public UpdateUserStatusCommandHandler(
        IApplicationDbContext context,
        ITokenBlacklistService tokenBlacklistService,
        IRealTimeNotificationService? notificationService = null)
    {
        _context = context;
        _tokenBlacklistService = tokenBlacklistService;
        _notificationService = notificationService;
    }

    public async Task<Result<bool>> Handle(UpdateUserStatusCommand request, CancellationToken cancellationToken)
    {
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

            var userTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == user.Id && !rt.IsRevoked)
                .ToListAsync(cancellationToken);

            foreach (var token in userTokens)
            {
                token.IsRevoked = true;
            }

            await _tokenBlacklistService.RevokeUserAsync(user.Id, cancellationToken);

            if (_notificationService != null)
            {
                await _notificationService.PublishToUserAsync(
                    user.Id,
                    "AccountFrozen",
                    new { message = "Hesabınız yönetici tarafından dondurulmuştur. Oturumunuz sonlandırılıyor." },
                    cancellationToken);
            }
        }
        else
        {
            user.IsActive = true;
            await _tokenBlacklistService.UnrevokeUserAsync(user.Id, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true, request.IsActive ? "Kullanıcı hesabı aktif duruma getirildi." : "Kullanıcı hesabı donduruldu/pasife alındı.");
    }
}
