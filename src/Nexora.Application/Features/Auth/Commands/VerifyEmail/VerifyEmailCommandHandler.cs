using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Auth.Commands.VerifyEmail;

public sealed class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<VerifyEmailCommandHandler> _logger;

    public VerifyEmailCommandHandler(
        IApplicationDbContext context,
        IEmailService emailService,
        ILogger<VerifyEmailCommandHandler> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<Result<string>> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken)
            ?? throw new NotFoundException("Kullanıcı bulunamadı.");

        if (user.IsEmailConfirmed)
        {
            return Result<string>.Success("E-posta adresiniz zaten daha önce doğrulanmış.");
        }

        var verificationCode = await _context.EmailVerificationCodes
            .Where(c => c.UserId == user.Id && !c.IsUsed)
            .OrderByDescending(c => c.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (verificationCode is null || verificationCode.Code != request.Code)
        {
            throw new BusinessValidationException("Girdiğiniz doğrulama kodu hatalı.");
        }

        if (verificationCode.ExpiresAtUtc < DateTime.UtcNow)
        {
            throw new BusinessValidationException("Doğrulama kodunun süresi dolmuş. Lütfen yeni bir kod talep ediniz.");
        }

        verificationCode.IsUsed = true;
        user.IsEmailConfirmed = true;

        await _context.SaveChangesAsync(cancellationToken);

        // Doğrulama başarılı olunca hoş geldin e-postası ilet
        var registeredUserName = $"{user.FirstName} {user.LastName}".Trim();
        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendWelcomeEmailAsync(user.Email, registeredUserName, CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Doğrulama sonrası hoşgeldin e-postası gönderilemedi. UserId: {UserId}", user.Id);
            }
        });

        return Result<string>.Success("E-posta adresiniz başarıyla doğrulandı. Artık güvenle giriş yapabilirsiniz.");
    }
}
