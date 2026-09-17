using Nexora.Application.Features.Orders.Dtos;

namespace Nexora.Application.Abstractions;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default);

    Task SendWelcomeEmailAsync(string to, string userName, CancellationToken cancellationToken = default);

    Task SendOrderConfirmationEmailAsync(OrderDto order, string to, string userName, CancellationToken cancellationToken = default);

    Task SendOrderStatusChangedEmailAsync(
        string to,
        string userName,
        string orderNumber,
        string newStatusText,
        string? trackingNumber,
        string? carrier,
        CancellationToken cancellationToken = default);
}
