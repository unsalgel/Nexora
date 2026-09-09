using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Auth.Commands.RevokeToken;

public sealed class RevokeTokenCommandHandler : IRequestHandler<RevokeTokenCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITokenBlacklistService _blacklistService;

    public RevokeTokenCommandHandler(IApplicationDbContext context, ITokenBlacklistService blacklistService)
    {
        _context = context;
        _blacklistService = blacklistService;
    }

    public async Task<Result<string>> Handle(RevokeTokenCommand request, CancellationToken cancellationToken)
    {
        var refreshToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken, cancellationToken)
            ?? throw new NotFoundException("Refresh token bulunamadı.");

        if (!refreshToken.IsRevoked)
        {
            refreshToken.IsRevoked = true;
            await _context.SaveChangesAsync(cancellationToken);
        }

        // Eğer mevcut access token'ın JTI'ı iletilmişse, anında kara listeye al (kalan ömrü kadar - max 60 dk)
        if (!string.IsNullOrWhiteSpace(request.Jti))
        {
            await _blacklistService.RevokeTokenAsync(request.Jti, TimeSpan.FromMinutes(60), cancellationToken);
        }

        return Result<string>.Success("Oturum başarıyla kapatıldı.");
    }
}
