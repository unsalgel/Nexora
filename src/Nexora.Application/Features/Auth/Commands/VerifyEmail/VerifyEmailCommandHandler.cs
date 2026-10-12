using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Auth.Commands.VerifyEmail;

public sealed class VerifyEmailCommandHandler(IApplicationDbContext context, IEmailService emailService,
    IAuthTokenProtector protector, IRealTimeNotificationService? notifications = null)
    : IRequestHandler<VerifyEmailCommand, Result<string>>
{
    public async Task<Result<string>> Handle(VerifyEmailCommand request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;
        await using var transaction = await context.BeginTransactionAsync("auth-email:" + email, ct);
        var userId = await context.Users.AsNoTracking().Where(u => u.Email == email || (u.PendingEmail == email && u.PendingEmailExpiresAtUtc > now))
            .Select(u => (Guid?)u.Id).FirstOrDefaultAsync(ct)
            ?? throw new BusinessValidationException("Geçersiz e-posta adresi veya doğrulama kodu.");
        await transaction.AcquireLockAsync($"auth:{userId}", ct);
        var user = await context.Users.SingleAsync(u => u.Id == userId, ct);
        var code = await context.EmailVerificationCodes.Where(c => c.UserId == userId && !c.IsUsed && c.TargetEmail == email)
            .OrderByDescending(c => c.CreatedAtUtc).FirstOrDefaultAsync(ct);
        if (code is null || code.ExpiresAtUtc <= DateTime.UtcNow || code.FailedAttempts >= 5)
            throw new BusinessValidationException("Geçersiz e-posta adresi veya doğrulama kodu.");
        if (!protector.VerifyCode(userId, "verify:" + email, request.Code, code.Code))
        {
            code.FailedAttempts++;
            if (code.FailedAttempts >= 5) code.IsUsed = true;
            await context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            throw new BusinessValidationException("Geçersiz e-posta adresi veya doğrulama kodu.");
        }
        var changedEmail = user.PendingEmail == email && user.PendingEmailExpiresAtUtc > DateTime.UtcNow;
        if (changedEmail)
        {
            if (await context.Users.AnyAsync(u => u.Id != userId && u.Email == email, ct))
                throw new ConflictException("Bu e-posta adresi kullanılamıyor.");
            var oldEmail = user.Email;
            user.Email = email;
            user.PendingEmail = null;
            user.PendingEmailExpiresAtUtc = null;
            await context.InvalidateSessionsAsync(user, ct);
            await emailService.SendEmailAsync(oldEmail, "Nexora e-posta değişikliği", "<p>Hesabınızın e-posta adresi değiştirildi. İşlem size ait değilse destek ile iletişime geçin.</p>", ct);
        }
        else if (user.Email != email)
            throw new BusinessValidationException("Geçersiz e-posta adresi veya doğrulama kodu.");
        code.IsUsed = true;
        user.IsEmailConfirmed = true;
        if (!changedEmail) await emailService.SendWelcomeEmailAsync(user.Email, $"{user.FirstName} {user.LastName}", ct);
        await context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        if (changedEmail && notifications is not null)
            await notifications.PublishToUserAsync(userId, "SessionRevoked", new { message = "E-posta adresiniz değişti. Lütfen yeniden giriş yapın." }, ct);
        return Result<string>.Success("E-posta adresiniz başarıyla doğrulandı.");
    }
}