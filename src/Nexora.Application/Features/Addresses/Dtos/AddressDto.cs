namespace Nexora.Application.Features.Addresses.Dtos;

public sealed record AddressDto(
    Guid Id,
    string Title,
    string FullName,
    string PhoneNumber,
    string City,
    string District,
    string DetailedAddress,
    string? PostalCode,
    bool IsDefault);
