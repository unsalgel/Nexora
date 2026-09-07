namespace Nexora.Application.Features.Dashboard.Dtos;

public sealed record OrderStatusDistributionDto(
    string Status,
    string StatusLabel,
    int Count
);
