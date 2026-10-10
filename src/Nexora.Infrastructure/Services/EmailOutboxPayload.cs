using Nexora.Application.Features.Orders.Dtos;

namespace Nexora.Infrastructure.Services;

public sealed record EmailOutboxPayload(
    string To,
    string? UserName = null,
    string? Subject = null,
    string? HtmlBody = null,
    OrderDto? Order = null,
    string? OrderNumber = null,
    string? Status = null,
    string? TrackingNumber = null,
    string? Carrier = null,
    string? Code = null);
