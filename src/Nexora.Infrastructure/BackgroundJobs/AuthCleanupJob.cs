using System.ComponentModel;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;

namespace Nexora.Infrastructure.BackgroundJobs;

public sealed class AuthCleanupJob(IApplicationDbContext context)
{
    [DisplayName("Süresi dolmuş doğrulama kodlarını ve eski oturum kayıtlarını temizler")]
    [DisableConcurrentExecution(120)]
    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        await using var transaction = await context.BeginTransactionAsync("auth-cleanup", cancellationToken);
        var otpCutoff = DateTime.UtcNow.AddDays(-1);
        var sessionCutoff = DateTime.UtcNow.AddDays(-30);
        // Her koşunun boyutu sınırlıdır; yakın dönem iptal kayıtları replay tespiti için korunur.
        var verification = await context.EmailVerificationCodes.Where(c => c.ExpiresAtUtc < otpCutoff)
            .OrderBy(c => c.ExpiresAtUtc).Take(1000).ToListAsync(cancellationToken);
        var reset = await context.PasswordResetCodes.Where(c => c.ExpiresAtUtc < otpCutoff)
            .OrderBy(c => c.ExpiresAtUtc).Take(1000).ToListAsync(cancellationToken);
        var sessions = await context.RefreshTokens.Where(t => t.ExpiresAtUtc < sessionCutoff)
            .OrderBy(t => t.ExpiresAtUtc).Take(1000).ToListAsync(cancellationToken);
        context.EmailVerificationCodes.RemoveRange(verification);
        context.PasswordResetCodes.RemoveRange(reset);
        context.RefreshTokens.RemoveRange(sessions);
        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }
}
