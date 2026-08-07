using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Auth.Commands.RevokeToken;

public sealed class RevokeTokenCommandHandler : IRequestHandler<RevokeTokenCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;

    public RevokeTokenCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(RevokeTokenCommand request, CancellationToken cancellationToken)
    {
        var refreshToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken, cancellationToken)
            ?? throw new NotFoundException("Refresh token bulunamadı.");

        if (refreshToken.IsRevoked)
            return Result<string>.Success("Oturum zaten kapatılmıştır.");

        refreshToken.IsRevoked = true;
        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success("Oturum başarıyla kapatıldı.");
    }
}
