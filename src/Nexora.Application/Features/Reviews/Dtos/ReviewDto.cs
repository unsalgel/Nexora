namespace Nexora.Application.Features.Reviews.Dtos;

public sealed record ReviewDto(
    Guid Id,
    Guid ProductId,
    Guid UserId,
    string UserFullName,
    int Rating,
    string? Comment,
    DateTime CreatedAtUtc
);
