using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Dashboard.Dtos;
using Nexora.Domain.Entities;
using Nexora.Domain.Enums;

namespace Nexora.Application.Features.Dashboard.Queries.GetSalesAnalytics;

public sealed class GetSalesAnalyticsQueryHandler : IRequestHandler<GetSalesAnalyticsQuery, Result<SalesAnalyticsDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSalesAnalyticsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<SalesAnalyticsDto>> Handle(GetSalesAnalyticsQuery request, CancellationToken cancellationToken)
    {
        var ordersQuery = _context.Orders.AsNoTracking();

        var totalOrdersAllTime = await ordersQuery.CountAsync(cancellationToken);

        var totalRevenueAllTime = await ordersQuery
            .Where(o => o.Status != OrderStatus.Cancelled)
            .SumAsync(o => (decimal?)o.TotalAmount, cancellationToken) ?? 0m;

        var averageOrderValue = totalOrdersAllTime > 0
            ? Math.Round(totalRevenueAllTime / totalOrdersAllTime, 2)
            : 0m;

        var dailySales = await GetDailySalesAsync(ordersQuery, request.Days, cancellationToken);
        var categorySales = await GetCategorySalesAsync(cancellationToken);
        var statusDistribution = await GetStatusDistributionAsync(ordersQuery, cancellationToken);

        var dto = new SalesAnalyticsDto(
            totalRevenueAllTime,
            totalOrdersAllTime,
            averageOrderValue,
            dailySales,
            categorySales,
            statusDistribution
        );

        return Result<SalesAnalyticsDto>.Success(dto);
    }

    private static async Task<List<DailySalesPointDto>> GetDailySalesAsync(
        IQueryable<Order> ordersQuery,
        int days,
        CancellationToken cancellationToken)
    {
        var startDate = DateTime.UtcNow.Date.AddDays(-days + 1);

        var rawOrders = await ordersQuery
            .Where(o => o.CreatedAtUtc >= startDate && o.Status != OrderStatus.Cancelled)
            .Select(o => new
            {
                Date = o.CreatedAtUtc.Date,
                o.TotalAmount
            })
            .ToListAsync(cancellationToken);

        var groupedByDate = rawOrders
            .GroupBy(o => o.Date)
            .ToDictionary(g => g.Key, g => new { Total = g.Sum(x => x.TotalAmount), Count = g.Count() });

        var result = new List<DailySalesPointDto>(days);

        for (var i = 0; i < days; i++)
        {
            var targetDate = startDate.AddDays(i);
            groupedByDate.TryGetValue(targetDate, out var dayStats);

            result.Add(new DailySalesPointDto(
                targetDate.ToString("yyyy-MM-dd"),
                dayStats?.Total ?? 0m,
                dayStats?.Count ?? 0
            ));
        }

        return result;
    }

    private async Task<List<CategorySalesPointDto>> GetCategorySalesAsync(CancellationToken cancellationToken)
    {
        var categoryGroups = await _context.OrderItems
            .AsNoTracking()
            .Where(oi => oi.Order.Status != OrderStatus.Cancelled && oi.Product != null && oi.Product.Category != null)
            .GroupBy(oi => new
            {
                CategoryId = oi.Product!.CategoryId,
                CategoryName = oi.Product.Category!.Name
            })
            .Select(g => new
            {
                g.Key.CategoryId,
                g.Key.CategoryName,
                TotalRevenue = g.Sum(x => x.TotalPrice),
                TotalQuantity = g.Sum(x => x.Quantity)
            })
            .ToListAsync(cancellationToken);

        var totalRevenue = categoryGroups.Sum(x => x.TotalRevenue);
        if (totalRevenue == 0m)
        {
            return new List<CategorySalesPointDto>();
        }

        return categoryGroups
            .Select(c => new CategorySalesPointDto(
                c.CategoryId,
                c.CategoryName,
                c.TotalRevenue,
                c.TotalQuantity,
                Math.Round((double)(c.TotalRevenue / totalRevenue) * 100, 2)
            ))
            .OrderByDescending(c => c.TotalRevenue)
            .ToList();
    }

    private static async Task<List<OrderStatusDistributionDto>> GetStatusDistributionAsync(
        IQueryable<Order> ordersQuery,
        CancellationToken cancellationToken)
    {
        var statusCounts = await ordersQuery
            .GroupBy(o => o.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.Status, g => g.Count, cancellationToken);

        var allStatuses = new[]
        {
            (Status: OrderStatus.Pending, Label: "Beklemede"),
            (Status: OrderStatus.Processing, Label: "Hazırlanıyor"),
            (Status: OrderStatus.Shipped, Label: "Kargoda"),
            (Status: OrderStatus.Delivered, Label: "Teslim Edildi"),
            (Status: OrderStatus.Cancelled, Label: "İptal Edildi")
        };

        return allStatuses
            .Select(s => new OrderStatusDistributionDto(
                s.Status.ToString(),
                s.Label,
                statusCounts.GetValueOrDefault(s.Status, 0)
            ))
            .ToList();
    }
}
