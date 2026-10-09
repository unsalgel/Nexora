using System.Security.Cryptography;
using System.Text;
using Nexora.Application.Common.Extensions;
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
    private readonly ICacheService? _cacheService;

    public VerifyEmailCommandHandler(
        IApplicationDbContext context,
        IEmailService emailService,
        ILogger<VerifyEmailCommandHandler> logger,
        ICacheService? cacheService = null)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
        _cacheService = cacheService;
    }

    public async Task<Result<string>> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken)
            ?? throw new BusinessValidationException("Geçersiz e-posta adresi veya doğrulama kodu.");

        if (user.IsEmailConfirmed)
        {
            return Result<string>.Success("E-posta adresiniz zaten daha önce doğrulanmış.");
        }

        var verificationCode = await _context.EmailVerificationCodes
            .Where(c => c.UserId == user.Id && !c.IsUsed)
            .OrderByDescending(c => c.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (verificationCode is null)
        {
            throw new BusinessValidationException("Geçerli bir doğrulama kodu bulunamadı. Lütfen yeni bir kod talep ediniz.");
        }

        if (verificationCode.ExpiresAtUtc < DateTime.UtcNow)
        {
            throw new BusinessValidationException("Doğrulama kodunun süresi dolmuş. Lütfen yeni bir kod talep ediniz.");
        }

        var inputCodeBytes = Encoding.UTF8.GetBytes(request.Code.Trim());
        var storedCodeBytes = Encoding.UTF8.GetBytes(verificationCode.Code);
        var isCodeMatch = inputCodeBytes.Length == storedCodeBytes.Length &&
                          CryptographicOperations.FixedTimeEquals(inputCodeBytes, storedCodeBytes);

        if (!isCodeMatch)
        {
            if (_cacheService != null)
            {
                var attemptKey = $"verify_attempts:{user.Id}:{verificationCode.Id}";
                var attempts = (await _cacheService.GetAsync<int>(attemptKey, cancellationToken)) + 1;
                if (attempts >= 5)
                {
                    verificationCode.IsUsed = true;
                    await _context.SaveChangesAsync(cancellationToken);
                    await _cacheService.RemoveAsync(attemptKey, cancellationToken);
                    throw new BusinessValidationException("Çok fazla hatalı deneme yapıldığı için doğrulama kodunuz iptal edildi. Lütfen yeni bir kod talep ediniz.");
                }

                await _cacheService.SetAsync(attemptKey, attempts, TimeSpan.FromMinutes(15), cancellationToken);
                throw new BusinessValidationException($"Girdiğiniz doğrulama kodu hatalı. Kalan deneme hakkı: {5 - attempts}.");
            }

            throw new BusinessValidationException("Girdiğiniz doğrulama kodu hatalı.");
        }

        if (_cacheService != null)
        {
            await _cacheService.RemoveAsync($"verify_attempts:{user.Id}:{verificationCode.Id}", cancellationToken);
        }

        verificationCode.IsUsed = true;
        user.IsEmailConfirmed = true;

        await _context.SaveChangesAsync(cancellationToken);


        var registeredUserName = $"{user.FirstName} {user.LastName}".Trim();
        _emailService.SendInBackground(
            svc => svc.SendWelcomeEmailAsync(user.Email, registeredUserName, CancellationToken.None),
            _logger,
            "Doğrulama sonrası hoşgeldin e-postası gönderilemedi. UserId: {UserId}",
            user.Id);

        return Result<string>.Success("E-posta adresiniz başarıyla doğrulandı. Artık güvenle giriş yapabilirsiniz.");
    }
}
