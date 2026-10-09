using System.Security.Cryptography;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Common.Extensions;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Auth.Commands.ResendVerificationCode;

public sealed class ResendVerificationCodeCommandHandler : IRequestHandler<ResendVerificationCodeCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<ResendVerificationCodeCommandHandler> _logger;

    public ResendVerificationCodeCommandHandler(
        IApplicationDbContext context,
        IEmailService emailService,
        ILogger<ResendVerificationCodeCommandHandler> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<Result<string>> Handle(ResendVerificationCodeCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (user is null)
        {
            return Result<string>.Success("Eğer e-posta adresi sistemimizde kayıtlıysa ve henüz doğrulanmamışsa, yeni doğrulama kodu gönderilmiştir.");
        }

        if (user.IsEmailConfirmed)
        {
            return Result<string>.Success("E-posta adresiniz zaten doğrulanmış durumda.");
        }

        var activeCodes = await _context.EmailVerificationCodes
            .Where(c => c.UserId == user.Id && !c.IsUsed && c.ExpiresAtUtc > DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var oldCode in activeCodes)
        {
            oldCode.IsUsed = true;
        }

        var newCode = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        var verificationCode = new EmailVerificationCode
        {
            UserId = user.Id,
            Code = newCode,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(15),
            IsUsed = false
        };

        _context.EmailVerificationCodes.Add(verificationCode);
        await _context.SaveChangesAsync(cancellationToken);

        var registeredUserName = $"{user.FirstName} {user.LastName}".Trim();
        _emailService.SendInBackground(
            svc => svc.SendEmailVerificationCodeEmailAsync(user.Email, registeredUserName, newCode, CancellationToken.None),
            _logger,
            "Yeni e-posta doğrulama kodu gönderilemedi. UserId: {UserId}",
            user.Id);

        return Result<string>.Success("Yeni doğrulama kodu e-posta adresinize gönderildi.");
    }
}
