namespace Nexora.Application.Features.Dashboard.Queries.GetSalesAnalytics;

public sealed record OrderStatusDistributionDto(
    string Status,
    string StatusLabel,
    int Count
);
