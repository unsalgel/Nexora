using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;

namespace Nexora.Api.Services;

public sealed class AuthenticationSessionValidator(IApplicationDbContext db)
{
    public async Task<bool> IsValidAsync(ClaimsPrincipal? principal, CancellationToken ct)
    {
        if (principal?.Identity?.IsAuthenticated != true ||
            !long.TryParse(principal.FindFirst("exp")?.Value, System.Globalization.NumberStyles.Integer,
                System.Globalization.CultureInfo.InvariantCulture, out var expiresAt) ||
            expiresAt <= DateTimeOffset.UtcNow.ToUnixTimeSeconds() ||
            !Guid.TryParse(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId) ||
            !Guid.TryParse(principal?.FindFirst("security_stamp")?.Value, out var stamp) ||
            !Guid.TryParse(principal?.FindFirst("sid")?.Value, out var sessionId)) return false;
        var now = DateTime.UtcNow;
        return await db.Users.AsNoTracking().AnyAsync(u => u.Id == userId && u.IsActive && u.IsEmailConfirmed &&
            u.SecurityStamp == stamp && u.RefreshTokens.Any(t => t.SessionId == sessionId && !t.IsRevoked && t.ExpiresAtUtc > now), ct);
    }
}
