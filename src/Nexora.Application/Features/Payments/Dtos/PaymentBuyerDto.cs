namespace Nexora.Application.Features.Payments.Dtos;

public sealed record PaymentBuyerDto(
    string Id,
    string Name,
    string Surname,
    string Email,
    string PhoneNumber,
    string IdentityNumber,
    string RegistrationAddress,
    string City,
    string Country,
    string ZipCode,
    string IpAddress);
