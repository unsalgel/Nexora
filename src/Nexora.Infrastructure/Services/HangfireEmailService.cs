using Hangfire;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Orders.Dtos;

namespace Nexora.Infrastructure.Services;

public sealed class HangfireEmailService : IEmailService
{
    private readonly IBackgroundJobClient _backgroundJobClient;

    public HangfireEmailService(IBackgroundJobClient backgroundJobClient)
    {
        _backgroundJobClient = backgroundJobClient;
    }

    public Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        _backgroundJobClient.Enqueue<SmtpEmailService>(s => s.SendEmailAsync(to, subject, htmlBody, CancellationToken.None));
        return Task.CompletedTask;
    }

    public Task SendWelcomeEmailAsync(string to, string userName, CancellationToken cancellationToken = default)
    {
        _backgroundJobClient.Enqueue<SmtpEmailService>(s => s.SendWelcomeEmailAsync(to, userName, CancellationToken.None));
        return Task.CompletedTask;
    }

    public Task SendOrderConfirmationEmailAsync(OrderDto order, string to, string userName, CancellationToken cancellationToken = default)
    {
        _backgroundJobClient.Enqueue<SmtpEmailService>(s => s.SendOrderConfirmationEmailAsync(order, to, userName, CancellationToken.None));
        return Task.CompletedTask;
    }

    public Task SendOrderStatusChangedEmailAsync(
        string to,
        string userName,
        string orderNumber,
        string newStatusText,
        string? trackingNumber,
        string? carrier,
        CancellationToken cancellationToken = default)
    {
        _backgroundJobClient.Enqueue<SmtpEmailService>(s => s.SendOrderStatusChangedEmailAsync(to, userName, orderNumber, newStatusText, trackingNumber, carrier, CancellationToken.None));
        return Task.CompletedTask;
    }

    public Task SendPasswordResetCodeEmailAsync(string to, string userName, string resetCode, CancellationToken cancellationToken = default)
    {
        _backgroundJobClient.Enqueue<SmtpEmailService>(s => s.SendPasswordResetCodeEmailAsync(to, userName, resetCode, CancellationToken.None));
        return Task.CompletedTask;
    }

    public Task SendEmailVerificationCodeEmailAsync(string to, string userName, string verificationCode, CancellationToken cancellationToken = default)
    {
        _backgroundJobClient.Enqueue<SmtpEmailService>(s => s.SendEmailVerificationCodeEmailAsync(to, userName, verificationCode, CancellationToken.None));
        return Task.CompletedTask;
    }
}
