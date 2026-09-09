namespace Nexora.Application.Features.Dashboard.Queries.GetSalesAnalytics;

public sealed record DailySalesPointDto(
    string Date,
    decimal TotalRevenue,
    int OrderCount
);
