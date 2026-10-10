using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Auth.Dtos;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Auth.Commands.RefreshToken;

public sealed class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, Result<AuthTokenDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtProvider _jwtProvider;
    private readonly IAuthTokenProtector _protector;

    public RefreshTokenCommandHandler(IApplicationDbContext context, IJwtProvider jwtProvider, IAuthTokenProtector protector)
    {
        _context = context;
        _jwtProvider = jwtProvider;
        _protector = protector;
    }

    public async Task<Result<AuthTokenDto>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var digest = _protector.HashRefreshToken(request.RefreshToken);
        var userId = await _context.RefreshTokens.AsNoTracking().Where(rt => rt.Token == digest)
            .Select(rt => (Guid?)rt.UserId).FirstOrDefaultAsync(cancellationToken)
            ?? throw new UnauthorizedException("Geçersiz refresh token.");
        await using var transaction = await _context.BeginTransactionAsync($"auth:{userId}", cancellationToken);
        var existingToken = await _context.RefreshTokens
            .Include(rt => rt.User)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(rt => rt.Token == digest, cancellationToken)
            ?? throw new UnauthorizedException("Geçersiz refresh token.");

        if (existingToken.IsRevoked)
        {
            var userTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == existingToken.UserId && !rt.IsRevoked)
                .ToListAsync(cancellationToken);

            foreach (var token in userTokens)
            {
                token.IsRevoked = true;
            }
            existingToken.User.SecurityStamp = Guid.NewGuid();

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            throw new UnauthorizedException("Şüpheli oturum etkinliği tespit edildi. Güvenliğiniz için tüm açık oturumlarınız sonlandırıldı. Lütfen tekrar giriş yapınız.");
        }

        if (existingToken.ExpiresAtUtc <= DateTime.UtcNow)
            throw new UnauthorizedException("Refresh token süresi dolmuştur. Lütfen tekrar giriş yapınız.");

        existingToken.IsRevoked = true;

        var user = existingToken.User;
        if (!user.IsActive || !user.IsEmailConfirmed)
            throw new UnauthorizedException("Hesabınız aktif değildir. Lütfen destek ekibiyle iletişime geçiniz.");

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var newAccessToken = _jwtProvider.GenerateAccessToken(user, roles, existingToken.SessionId);
        var newRefreshTokenValue = _jwtProvider.GenerateRefreshToken();
        var expirationDays = _jwtProvider.GetRefreshTokenExpirationDays();
        if (expirationDays <= 0) expirationDays = 7;

        var newRefreshToken = new Domain.Entities.RefreshToken
        {
            UserId = user.Id,
            Token = _protector.HashRefreshToken(newRefreshTokenValue),
            SessionId = existingToken.SessionId,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(expirationDays),
            IsRevoked = false
        };

        _context.RefreshTokens.Add(newRefreshToken);
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var tokenDto = new AuthTokenDto(
            newAccessToken,
            newRefreshTokenValue,
            newRefreshToken.ExpiresAtUtc);

        return Result<AuthTokenDto>.Success(tokenDto, "Token başarıyla yenilendi.");
    }
}
