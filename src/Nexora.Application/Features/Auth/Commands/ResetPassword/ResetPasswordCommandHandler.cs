using System.Security.Cryptography;
using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Auth.Commands.ResetPassword;

public sealed class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICacheService? _cacheService;

    public ResetPasswordCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        ICacheService? cacheService = null)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _cacheService = cacheService;
    }

    public async Task<Result<string>> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken)
            ?? throw new BusinessValidationException("Geçersiz e-posta adresi veya sıfırlama kodu.");

        var resetCode = await _context.PasswordResetCodes
            .Where(c => c.UserId == user.Id && !c.IsUsed)
            .OrderByDescending(c => c.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (resetCode == null)
        {
            throw new BusinessValidationException("Geçerli bir sıfırlama kodu bulunamadı. Lütfen tekrar kod talep edin.");
        }

        if (resetCode.ExpiresAtUtc < DateTime.UtcNow)
        {
            throw new BusinessValidationException("Sıfırlama kodunun geçerlilik süresi dolmuştur. Lütfen tekrar kod talep edin.");
        }

        var inputCodeBytes = Encoding.UTF8.GetBytes(request.Code.Trim());
        var storedCodeBytes = Encoding.UTF8.GetBytes(resetCode.Code);
        var isCodeMatch = inputCodeBytes.Length == storedCodeBytes.Length &&
                          CryptographicOperations.FixedTimeEquals(inputCodeBytes, storedCodeBytes);

        if (!isCodeMatch)
        {
            if (_cacheService != null)
            {
                var attemptKey = $"reset_attempts:{user.Id}:{resetCode.Id}";
                var attempts = (await _cacheService.GetAsync<int>(attemptKey, cancellationToken)) + 1;
                if (attempts >= 5)
                {
                    resetCode.IsUsed = true;
                    await _context.SaveChangesAsync(cancellationToken);
                    await _cacheService.RemoveAsync(attemptKey, cancellationToken);
                    throw new BusinessValidationException("Çok fazla hatalı deneme yapıldığı için sıfırlama kodu iptal edildi. Lütfen tekrar kod talep ediniz.");
                }

                await _cacheService.SetAsync(attemptKey, attempts, TimeSpan.FromMinutes(15), cancellationToken);
                throw new BusinessValidationException($"Girdiğiniz sıfırlama kodu geçersizdir. Kalan deneme hakkı: {5 - attempts}.");
            }

            throw new BusinessValidationException("Girdiğiniz sıfırlama kodu geçersizdir.");
        }

        if (_cacheService != null)
        {
            await _cacheService.RemoveAsync($"reset_attempts:{user.Id}:{resetCode.Id}", cancellationToken);
        }

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        resetCode.IsUsed = true;

        var refreshTokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == user.Id && !rt.IsRevoked)
            .ToListAsync(cancellationToken);

        foreach (var token in refreshTokens)
        {
            token.IsRevoked = true;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success("Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.");
    }
}
