using System.Security.Cryptography;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Users.Dtos;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Users.Commands.UpdateProfile;

public sealed record UpdateProfileCommand(Guid UserId, string FirstName, string LastName, string Email, string? CurrentPassword = null)
    : IRequest<Result<UserProfileDto>>;

public sealed class UpdateProfileCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher,
    IAuthTokenProtector protector, IEmailService emailService)
    : IRequestHandler<UpdateProfileCommand, Result<UserProfileDto>>
{
    public async Task<Result<UserProfileDto>> Handle(UpdateProfileCommand request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;
        await using var transaction = await context.BeginTransactionAsync("auth-email:" + email, ct);
        await transaction.AcquireLockAsync($"auth:{request.UserId}", ct);
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new NotFoundException("Kullanıcı bulunamadı.");
        if (email != user.Email)
        {
            if (string.IsNullOrWhiteSpace(request.CurrentPassword) || !passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
                throw new BusinessValidationException("E-posta değişikliği için mevcut şifrenizi doğrulayın.");
            if (await context.Users.AnyAsync(u => u.Id != user.Id && (u.Email == email || (u.PendingEmail == email && u.PendingEmailExpiresAtUtc > now)), ct))
                throw new ConflictException("Bu e-posta adresi kullanılamıyor.");
            var latest = await context.EmailVerificationCodes.Where(c => c.UserId == user.Id && c.TargetEmail == email)
                .OrderByDescending(c => c.CreatedAtUtc).FirstOrDefaultAsync(ct);
            if (latest is not null && latest.CreatedAtUtc > DateTime.UtcNow.AddMinutes(-1) &&
                (latest.IsUsed || latest.ExpiresAtUtc <= DateTime.UtcNow))
                throw new TooManyRequestsException("Bu adrese yeni doğrulama kodu göndermek için lütfen bir dakika bekleyin.");
            user.PendingEmail = email;
            user.PendingEmailExpiresAtUtc = latest is not null && latest.CreatedAtUtc > now.AddMinutes(-1) ? latest.ExpiresAtUtc : now.AddMinutes(15);
            if (latest is null || latest.CreatedAtUtc <= DateTime.UtcNow.AddMinutes(-1))
            {
                var codes = await context.EmailVerificationCodes.Where(c => c.UserId == user.Id && !c.IsUsed).ToListAsync(ct);
                foreach (var old in codes) old.IsUsed = true;
                var raw = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
                context.EmailVerificationCodes.Add(new EmailVerificationCode { UserId = user.Id, TargetEmail = email,
                    Code = protector.HashCode(user.Id, "verify:" + email, raw), ExpiresAtUtc = DateTime.UtcNow.AddMinutes(15) });
                await emailService.SendEmailVerificationCodeEmailAsync(email, $"{user.FirstName} {user.LastName}", raw, ct);
            }
        }
        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        await context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return Result<UserProfileDto>.Success(new(user.Id, user.FirstName, user.LastName, user.Email, user.IsEmailConfirmed, user.PendingEmail));
    }
}
