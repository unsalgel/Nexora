using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Auth.Commands.RevokeToken;

public sealed class RevokeTokenCommandHandler(IApplicationDbContext context, IAuthTokenProtector protector)
    : IRequestHandler<RevokeTokenCommand, Result<string>>
{
    public async Task<Result<string>> Handle(RevokeTokenCommand request, CancellationToken ct)
    {
        var digest = string.IsNullOrWhiteSpace(request.RefreshToken) ? null : protector.HashRefreshToken(request.RefreshToken);
        var token = digest is null ? null : await context.RefreshTokens.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Token == digest && (!request.UserId.HasValue || t.UserId == request.UserId), ct);
        var userId = token?.UserId ?? request.UserId;
        var sessionId = token?.SessionId ?? request.SessionId;
        if (userId.HasValue && sessionId.HasValue)
        {
            await using var transaction = await context.BeginTransactionAsync($"auth:{userId}", ct);
            var sessions = await context.RefreshTokens.Where(t => t.UserId == userId && t.SessionId == sessionId && !t.IsRevoked).ToListAsync(ct);
            foreach (var session in sessions) session.IsRevoked = true;
            await context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        }
        return Result<string>.Success("Oturum başarıyla kapatıldı.");
    }
}