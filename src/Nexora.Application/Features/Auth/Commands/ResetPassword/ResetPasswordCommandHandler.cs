using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Auth.Commands.ResetPassword;

public sealed class ResetPasswordCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher,
    IAuthTokenProtector protector, IRealTimeNotificationService? notifications = null)
    : IRequestHandler<ResetPasswordCommand, Result<string>>
{
    public async Task<Result<string>> Handle(ResetPasswordCommand request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var userId = await context.Users.AsNoTracking().Where(u => u.Email == email).Select(u => (Guid?)u.Id).FirstOrDefaultAsync(ct)
            ?? throw new BusinessValidationException("Geçersiz e-posta adresi veya sıfırlama kodu.");
        await using var transaction = await context.BeginTransactionAsync($"auth:{userId}", ct);
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.Email == email, ct)
            ?? throw new BusinessValidationException("Geçersiz e-posta adresi veya sıfırlama kodu.");
        var code = await context.PasswordResetCodes.Where(c => c.UserId == userId && !c.IsUsed)
            .OrderByDescending(c => c.CreatedAtUtc).FirstOrDefaultAsync(ct);
        if (code is null || code.ExpiresAtUtc <= DateTime.UtcNow || code.FailedAttempts >= 5)
            throw new BusinessValidationException("Geçersiz e-posta adresi veya sıfırlama kodu.");
        if (!protector.VerifyCode(userId, "reset", request.Code, code.Code))
        {
            code.FailedAttempts++;
            if (code.FailedAttempts >= 5) code.IsUsed = true;
            await context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            throw new BusinessValidationException("Geçersiz e-posta adresi veya sıfırlama kodu.");
        }
        user.PasswordHash = passwordHasher.Hash(request.NewPassword);
        code.IsUsed = true;
        await context.InvalidateSessionsAsync(user, ct);
        await context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        if (notifications is not null)
            await notifications.PublishToUserAsync(userId, "SessionRevoked", new { message = "Şifreniz değişti. Lütfen yeniden giriş yapın." }, ct);
        return Result<string>.Success("Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.");
    }
}
