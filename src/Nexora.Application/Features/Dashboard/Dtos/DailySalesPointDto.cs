namespace Nexora.Application.Features.Dashboard.Dtos;

public sealed record DailySalesPointDto(
    string Date,
    decimal TotalRevenue,
    int OrderCount
);
