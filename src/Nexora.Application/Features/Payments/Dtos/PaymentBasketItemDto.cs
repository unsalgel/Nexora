namespace Nexora.Application.Features.Payments.Dtos;

public sealed record PaymentBasketItemDto(
    string Id,
    string Name,
    string Category,
    decimal Price);
