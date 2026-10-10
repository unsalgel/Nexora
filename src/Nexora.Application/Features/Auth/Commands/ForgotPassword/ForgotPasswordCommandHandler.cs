using System.Security.Cryptography;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Entities;

namespace Nexora.Application.Features.Auth.Commands.ForgotPassword;

public sealed class ForgotPasswordCommandHandler(IApplicationDbContext context, IEmailService emailService, IAuthTokenProtector protector)
    : IRequestHandler<ForgotPasswordCommand, Result<string>>
{
    public const string GenericResponse = "Eğer e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama kodu gönderilmiştir.";
    public async Task<Result<string>> Handle(ForgotPasswordCommand request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var userId = await context.Users.AsNoTracking().Where(u => u.Email == email).Select(u => (Guid?)u.Id).FirstOrDefaultAsync(ct);
        if (!userId.HasValue) return Result<string>.Success(GenericResponse);
        await using var transaction = await context.BeginTransactionAsync($"auth:{userId}", ct);
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.Email == email, ct);
        if (user is null) return Result<string>.Success(GenericResponse);
        var recent = await context.PasswordResetCodes.Where(c => c.UserId == userId).OrderByDescending(c => c.CreatedAtUtc).FirstOrDefaultAsync(ct);
        if (recent is not null && recent.CreatedAtUtc > DateTime.UtcNow.AddMinutes(-1))
            return Result<string>.Success(GenericResponse);
        var codes = await context.PasswordResetCodes.Where(c => c.UserId == userId && !c.IsUsed).ToListAsync(ct);
        foreach (var old in codes) old.IsUsed = true;
        var raw = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        context.PasswordResetCodes.Add(new PasswordResetCode { UserId = userId.Value, Code = protector.HashCode(userId.Value, "reset", raw), ExpiresAtUtc = DateTime.UtcNow.AddMinutes(15) });
        await emailService.SendPasswordResetCodeEmailAsync(user.Email, $"{user.FirstName} {user.LastName}", raw, ct);
        await context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return Result<string>.Success(GenericResponse);
    }
}
