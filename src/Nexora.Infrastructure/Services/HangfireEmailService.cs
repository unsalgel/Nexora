using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Orders.Dtos;
using Nexora.Domain.Entities;

namespace Nexora.Infrastructure.Services;

public sealed class HangfireEmailService(IApplicationDbContext context, IDataProtectionProvider protectionProvider) : IEmailService
{
    public const string ProtectionPurpose = "Nexora.Outbox.Email.v1";
    private readonly IDataProtector _protector = protectionProvider.CreateProtector(ProtectionPurpose);

    public Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
        => StageAsync("email", new(to, Subject: subject, HtmlBody: htmlBody), cancellationToken);

    public Task SendWelcomeEmailAsync(string to, string userName, CancellationToken cancellationToken = default)
        => StageAsync("welcome", new(to, UserName: userName), cancellationToken);

    public Task SendOrderConfirmationEmailAsync(OrderDto order, string to, string userName, CancellationToken cancellationToken = default)
        => StageAsync("order-confirmation", new(to, UserName: userName, Order: order), cancellationToken);

    public Task SendOrderStatusChangedEmailAsync(string to, string userName, string orderNumber, string newStatusText,
        string? trackingNumber, string? carrier, CancellationToken cancellationToken = default)
        => StageAsync("order-status", new(to, UserName: userName, OrderNumber: orderNumber, Status: newStatusText,
            TrackingNumber: trackingNumber, Carrier: carrier), cancellationToken);

    public Task SendPasswordResetCodeEmailAsync(string to, string userName, string resetCode, CancellationToken cancellationToken = default)
        => StageAsync("password-reset", new(to, UserName: userName, Code: resetCode), cancellationToken);

    public Task SendEmailVerificationCodeEmailAsync(string to, string userName, string verificationCode, CancellationToken cancellationToken = default)
        => StageAsync("email-verification", new(to, UserName: userName, Code: verificationCode), cancellationToken);

    private Task StageAsync(string kind, EmailOutboxPayload payload, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        // İş verisi ve e-posta aynı SaveChanges transaction'ında kalıcılaşır; bu servis kendi commit'ini yapmaz.
        context.OutboxMessages.Add(new OutboxMessage
        {
            Id = Guid.NewGuid(),
            Kind = kind,
            ProtectedPayload = _protector.Protect(JsonSerializer.Serialize(payload)),
            AvailableAtUtc = DateTime.UtcNow
        });
        return Task.CompletedTask;
    }
}
