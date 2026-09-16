namespace Nexora.Application.Features.Reviews.Dtos;

public sealed record AdminReviewDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    Guid UserId,
    string UserFullName,
    string UserEmail,
    int Rating,
    string? Comment,
    DateTime CreatedAtUtc
);
