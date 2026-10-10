using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Domain.Entities;

namespace Nexora.Application.Features.Auth;

internal static class AuthSessionExtensions
{
    public static async Task InvalidateSessionsAsync(this IApplicationDbContext context, User user, CancellationToken ct)
    {
        user.SecurityStamp = Guid.NewGuid();
        var tokens = await context.RefreshTokens.Where(t => t.UserId == user.Id && !t.IsRevoked).ToListAsync(ct);
        foreach (var token in tokens) token.IsRevoked = true;
    }
}
