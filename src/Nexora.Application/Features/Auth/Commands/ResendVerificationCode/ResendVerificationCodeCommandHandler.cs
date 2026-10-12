using System.Security.Cryptography;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Entities;

namespace Nexora.Application.Features.Auth.Commands.ResendVerificationCode;

public sealed class ResendVerificationCodeCommandHandler(IApplicationDbContext context, IEmailService emailService, IAuthTokenProtector protector)
    : IRequestHandler<ResendVerificationCodeCommand, Result<string>>
{
    public const string GenericResponse = "Eğer e-posta adresi sistemimizde kayıtlıysa ve doğrulama gerekiyorsa, yeni doğrulama kodu gönderilmiştir.";
    public async Task<Result<string>> Handle(ResendVerificationCodeCommand request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;
        await using var transaction = await context.BeginTransactionAsync("auth-email:" + email, ct);
        var userId = await context.Users.AsNoTracking().Where(u => u.Email == email || (u.PendingEmail == email && u.PendingEmailExpiresAtUtc > now)).Select(u => (Guid?)u.Id).FirstOrDefaultAsync(ct);
        if (!userId.HasValue) return Result<string>.Success(GenericResponse);
        await transaction.AcquireLockAsync($"auth:{userId}", ct);
        var user = await context.Users.SingleAsync(u => u.Id == userId, ct);
        if (user.Email == email && user.IsEmailConfirmed) return Result<string>.Success(GenericResponse);
        if (user.Email != email && (user.PendingEmail != email || user.PendingEmailExpiresAtUtc <= DateTime.UtcNow)) return Result<string>.Success(GenericResponse);
        var recent = await context.EmailVerificationCodes.Where(c => c.UserId == userId && c.TargetEmail == email)
            .OrderByDescending(c => c.CreatedAtUtc).FirstOrDefaultAsync(ct);
        if (recent is not null && recent.CreatedAtUtc > DateTime.UtcNow.AddMinutes(-1)) return Result<string>.Success(GenericResponse);
        var codes = await context.EmailVerificationCodes.Where(c => c.UserId == userId && !c.IsUsed && c.TargetEmail == email).ToListAsync(ct);
        foreach (var old in codes) old.IsUsed = true;
        if (user.PendingEmail == email) user.PendingEmailExpiresAtUtc = now.AddMinutes(15);
        var raw = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        context.EmailVerificationCodes.Add(new EmailVerificationCode { UserId = userId.Value, TargetEmail = email, Code = protector.HashCode(userId.Value, "verify:" + email, raw), ExpiresAtUtc = DateTime.UtcNow.AddMinutes(15) });
        await emailService.SendEmailVerificationCodeEmailAsync(email, $"{user.FirstName} {user.LastName}", raw, ct);
        await context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return Result<string>.Success(GenericResponse);
    }
}