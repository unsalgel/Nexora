namespace Nexora.Application.Features.Dashboard.Dtos;

public sealed record CategorySalesPointDto(
    Guid CategoryId,
    string CategoryName,
    decimal TotalRevenue,
    int ItemCount,
    double Percentage
);
