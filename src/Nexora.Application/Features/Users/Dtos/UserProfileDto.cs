namespace Nexora.Application.Features.Users.Dtos;

public sealed record UserProfileDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    bool IsEmailConfirmed);
