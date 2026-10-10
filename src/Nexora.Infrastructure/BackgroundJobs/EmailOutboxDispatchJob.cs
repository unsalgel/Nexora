using System.Text.Json;
using Hangfire;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Infrastructure.Services;

namespace Nexora.Infrastructure.BackgroundJobs;

public sealed class EmailOutboxDispatchJob(
    IApplicationDbContext context,
    IDataProtectionProvider protectionProvider,
    SmtpEmailService smtp,
    ILogger<EmailOutboxDispatchJob> logger)
{
    [DisableConcurrentExecution(120)]
    public async Task DispatchAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var otpCutoff = now.AddMinutes(-10);
        var generalCutoff = now.AddDays(-3);
        var messages = await context.OutboxMessages
            .Where(x => x.ProcessedAtUtc == null && (x.AvailableAtUtc <= now || x.Attempts >= 10 ||
                x.CreatedAtUtc <= generalCutoff ||
                ((x.Kind == "password-reset" || x.Kind == "email-verification") && x.CreatedAtUtc <= otpCutoff)))
            .OrderBy(x => x.AvailableAtUtc).ThenBy(x => x.Id)
            .Take(50).ToListAsync(cancellationToken);
        var protector = protectionProvider.CreateProtector(HangfireEmailService.ProtectionPurpose);

        foreach (var message in messages)
        {
            cancellationToken.ThrowIfCancellationRequested();
            // OTP e-postaları kodun ömründen sonra tekrar gönderilmez; diğer işler de sınırsız bekletilmez.
            var lifetime = message.Kind is "password-reset" or "email-verification"
                ? TimeSpan.FromMinutes(10) : TimeSpan.FromDays(3);
            if (message.CreatedAtUtc <= DateTime.UtcNow.Subtract(lifetime) || message.Attempts >= 10)
            {
                message.ProcessedAtUtc = DateTime.UtcNow;
                message.LastError = message.Attempts >= 10 ? "AttemptsExhausted" : "Expired";
                message.ProtectedPayload = string.Empty;
                logger.LogWarning("E-posta kuyruğu işi sonlandırıldı. İş: {Id}, neden: {Reason}", message.Id, message.LastError);
                await context.SaveChangesAsync(cancellationToken);
                continue;
            }
            try
            {
                var payload = JsonSerializer.Deserialize<EmailOutboxPayload>(protector.Unprotect(message.ProtectedPayload))
                    ?? throw new InvalidOperationException("E-posta kuyruğu verisi okunamadı.");
                await SendAsync(message.Kind, payload, cancellationToken);
                message.ProcessedAtUtc = DateTime.UtcNow;
                message.LastError = null;
                message.ProtectedPayload = string.Empty;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                message.Attempts++;
                message.LastError = ex.GetType().Name;
                message.AvailableAtUtc = DateTime.UtcNow.AddMinutes(Math.Min(60, Math.Pow(2, Math.Min(message.Attempts, 6))));
                logger.LogWarning("E-posta kuyruğu işi başarısız. İş: {Id}, deneme: {Attempt}, hata: {ErrorType}",
                    message.Id, message.Attempts, message.LastError);
                if (message.Attempts >= 10)
                {
                    message.ProcessedAtUtc = DateTime.UtcNow;
                    message.LastError = "AttemptsExhausted";
                    message.ProtectedPayload = string.Empty;
                }
            }
            await context.SaveChangesAsync(cancellationToken);
        }

        var retentionCutoff = DateTime.UtcNow.AddDays(-30);
        var completed = await context.OutboxMessages
            .Where(x => x.ProcessedAtUtc != null && x.ProcessedAtUtc < retentionCutoff)
            .OrderBy(x => x.ProcessedAtUtc).ThenBy(x => x.Id).Take(1000).ToListAsync(cancellationToken);
        if (completed.Count > 0)
        {
            context.OutboxMessages.RemoveRange(completed);
            await context.SaveChangesAsync(cancellationToken);
        }
    }

    private Task SendAsync(string kind, EmailOutboxPayload payload, CancellationToken cancellationToken) => kind switch
    {
        "email" => smtp.SendEmailAsync(payload.To, payload.Subject!, payload.HtmlBody!, cancellationToken),
        "welcome" => smtp.SendWelcomeEmailAsync(payload.To, payload.UserName!, cancellationToken),
        "order-confirmation" => smtp.SendOrderConfirmationEmailAsync(payload.Order!, payload.To, payload.UserName!, cancellationToken),
        "order-status" => smtp.SendOrderStatusChangedEmailAsync(payload.To, payload.UserName!, payload.OrderNumber!, payload.Status!,
            payload.TrackingNumber, payload.Carrier, cancellationToken),
        "password-reset" => smtp.SendPasswordResetCodeEmailAsync(payload.To, payload.UserName!, payload.Code!, cancellationToken),
        "email-verification" => smtp.SendEmailVerificationCodeEmailAsync(payload.To, payload.UserName!, payload.Code!, cancellationToken),
        _ => throw new InvalidOperationException("Bilinmeyen e-posta kuyruğu türü.")
    };
}
