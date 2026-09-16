namespace Nexora.Application.Features.Users.Dtos;

public sealed record UserDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    bool IsActive,
    IReadOnlyList<string> Roles,
    int OrderCount,
    DateTime CreatedAtUtc
);
