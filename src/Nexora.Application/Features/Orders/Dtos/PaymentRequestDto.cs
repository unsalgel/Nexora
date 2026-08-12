namespace Nexora.Application.Features.Orders.Dtos;

public sealed record PaymentRequestDto(
    string CardHolderName,
    string CardNumber,
    string ExpirationMonth,
    string ExpirationYear,
    string Cvv);
