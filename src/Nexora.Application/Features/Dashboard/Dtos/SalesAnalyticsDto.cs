namespace Nexora.Application.Features.Dashboard.Dtos;

public sealed record SalesAnalyticsDto(
    decimal TotalRevenueAllTime,
    int TotalOrdersAllTime,
    decimal AverageOrderValue,
    List<DailySalesPointDto> DailySales,
    List<CategorySalesPointDto> CategorySales,
    List<OrderStatusDistributionDto> StatusDistribution
);
