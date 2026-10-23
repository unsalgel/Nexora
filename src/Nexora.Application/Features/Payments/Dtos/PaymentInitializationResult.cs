namespace Nexora.Application.Features.Payments.Dtos;

public sealed record PaymentInitializationResult(
    bool IsSuccess,
    string? Token,
    string? CheckoutFormContent,
    string? PaymentPageUrl,
    string? ErrorMessage,
    string? OrderNumber = null);
