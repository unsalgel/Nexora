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

    public ResetPasswordCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result<string>> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken)
            ?? throw new NotFoundException("Kullanıcı bulunamadı.");

        var resetCode = await _context.PasswordResetCodes
            .Where(c => c.UserId == user.Id && c.Code == request.Code.Trim() && !c.IsUsed)
            .OrderByDescending(c => c.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (resetCode == null)
        {
            throw new BusinessValidationException("Girdiğiniz sıfırlama kodu geçersizdir.");
        }

        if (resetCode.ExpiresAtUtc < DateTime.UtcNow)
        {
            throw new BusinessValidationException("Sıfırlama kodunun geçerlilik süresi dolmuştur. Lütfen tekrar kod talep edin.");
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
