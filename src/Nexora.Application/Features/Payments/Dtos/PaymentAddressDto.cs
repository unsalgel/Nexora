namespace Nexora.Application.Features.Payments.Dtos;

public sealed record PaymentAddressDto(
    string ContactName,
    string City,
    string Country,
    string AddressLine,
    string ZipCode);
