using System.Security.Cryptography;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Entities;

namespace Nexora.Application.Features.Auth.Commands.ForgotPassword;

public sealed class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public ForgotPasswordCommandHandler(IApplicationDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<Result<string>> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _context.Users
            .AsNoTracking()
            .Where(u => u.Email.ToLower() == normalizedEmail)
            .Select(u => new { u.Id, u.Email, u.FirstName, u.LastName })
            .FirstOrDefaultAsync(cancellationToken);

        if (user == null)
        {
            return Result<string>.Success("Eğer e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama kodu gönderilmiştir.");
        }

        var activeCodes = await _context.PasswordResetCodes
            .Where(c => c.UserId == user.Id && !c.IsUsed && c.ExpiresAtUtc > DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var oldCode in activeCodes)
        {
            oldCode.IsUsed = true;
        }

        var resetCode = RandomNumberGenerator.GetInt32(100000, 999999).ToString();

        var passwordResetCode = new PasswordResetCode
        {
            UserId = user.Id,
            Code = resetCode,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(15),
            IsUsed = false
        };

        _context.PasswordResetCodes.Add(passwordResetCode);
        await _context.SaveChangesAsync(cancellationToken);

        var userName = $"{user.FirstName} {user.LastName}".Trim();
        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendPasswordResetCodeEmailAsync(user.Email, userName, resetCode, CancellationToken.None);
            }
            catch
            {
            }
        });

        return Result<string>.Success("Şifre sıfırlama kodunuz e-posta adresinize gönderildi.");
    }
}
