namespace Nexora.Application.Features.Payments.Dtos;

public sealed record PaymentInitializationRequest(
    string OrderNumber,
    decimal TotalAmount,
    string CallbackUrl,
    PaymentBuyerDto Buyer,
    PaymentAddressDto ShippingAddress,
    PaymentAddressDto BillingAddress,
    IReadOnlyList<PaymentBasketItemDto> BasketItems);
