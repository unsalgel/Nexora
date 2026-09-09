namespace Nexora.Application.Features.Dashboard.Queries.GetSalesAnalytics;

public sealed record CategorySalesPointDto(
    Guid CategoryId,
    string CategoryName,
    decimal TotalRevenue,
    int ItemCount,
    double Percentage
);
