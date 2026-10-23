namespace Nexora.Application.Features.Payments.Dtos;

public sealed record PaymentVerificationResult(
    bool IsSuccess,
    string? PaymentId,
    string? OrderNumber,
    decimal PaidAmount,
    string? ErrorMessage,
    bool IsDefinitiveFailure = false,
    int? FraudStatus = null,
    string? Currency = null);
