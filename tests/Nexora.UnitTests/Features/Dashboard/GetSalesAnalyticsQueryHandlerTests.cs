using FluentAssertions;
using Nexora.Application.Features.Dashboard.Queries.GetSalesAnalytics;
using Nexora.Domain.Entities;
using Nexora.Domain.Enums;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Dashboard;

public sealed class GetSalesAnalyticsQueryHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;
    private readonly GetSalesAnalyticsQueryHandler _handler;

    public GetSalesAnalyticsQueryHandlerTests()
    {
        _context = TestDbContextFactory.Create();
        _handler = new GetSalesAnalyticsQueryHandler(_context);
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task Handle_WhenNoOrdersExist_ReturnsZeroedMetrics()
    {
        // Arrange
        var query = new GetSalesAnalyticsQuery(Days: 30);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.TotalOrdersAllTime.Should().Be(0);
        result.Data.TotalRevenueAllTime.Should().Be(0m);
        result.Data.AverageOrderValue.Should().Be(0m);
        result.Data.DailySales.Should().HaveCount(30);
        result.Data.CategorySales.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_WhenOrdersExist_ReturnsCorrectAggregationsAndPercentages()
    {
        // Arrange
        var category1 = new Category { Id = Guid.NewGuid(), Name = "Elektronik" };
        var category2 = new Category { Id = Guid.NewGuid(), Name = "Moda" };
        _context.Categories.AddRange(category1, category2);

        var product1 = new Product { Id = Guid.NewGuid(), Name = "Laptop", SKU = "LAP-001", CategoryId = category1.Id, Price = 1000m };
        var product2 = new Product { Id = Guid.NewGuid(), Name = "T-Shirt", SKU = "TSH-001", CategoryId = category2.Id, Price = 500m };
        _context.Products.AddRange(product1, product2);

        var order1 = new Order
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            OrderNumber = "NX-ORD-1001",
            ShippingAddress = "İstanbul, Kadıköy",
            TotalAmount = 2000m,
            Status = OrderStatus.Delivered,
            PaymentStatus = PaymentStatus.Success,
            CreatedAtUtc = DateTime.UtcNow
        };

        var order2 = new Order
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            OrderNumber = "NX-ORD-1002",
            ShippingAddress = "Ankara, Çankaya",
            TotalAmount = 1000m,
            Status = OrderStatus.Processing,
            PaymentStatus = PaymentStatus.Success,
            CreatedAtUtc = DateTime.UtcNow
        };

        var cancelledOrder = new Order
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            OrderNumber = "NX-ORD-1003",
            ShippingAddress = "İzmir, Karşıyaka",
            TotalAmount = 5000m,
            Status = OrderStatus.Cancelled,
            PaymentStatus = PaymentStatus.Failed,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Orders.AddRange(order1, order2, cancelledOrder);

        var orderItem1 = new OrderItem
        {
            Id = Guid.NewGuid(),
            OrderId = order1.Id,
            ProductId = product1.Id,
            ProductName = product1.Name,
            UnitPrice = 1000m,
            Quantity = 2,
            TotalPrice = 2000m
        };

        var orderItem2 = new OrderItem
        {
            Id = Guid.NewGuid(),
            OrderId = order2.Id,
            ProductId = product2.Id,
            ProductName = product2.Name,
            UnitPrice = 500m,
            Quantity = 2,
            TotalPrice = 1000m
        };

        _context.OrderItems.AddRange(orderItem1, orderItem2);
        await _context.SaveChangesAsync();

        var query = new GetSalesAnalyticsQuery(Days: 7);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.TotalOrdersAllTime.Should().Be(3); // Toplam sipariş (iptal dahil kayıt sayısı)
        result.Data.TotalRevenueAllTime.Should().Be(3000m); // 2000 + 1000 (iptal hariç)
        result.Data.AverageOrderValue.Should().Be(1000m); // 3000 / 3
        result.Data.DailySales.Should().HaveCount(7);
        result.Data.CategorySales.Should().HaveCount(2);

        var elecCat = result.Data.CategorySales.FirstOrDefault(c => c.CategoryName == "Elektronik");
        elecCat.Should().NotBeNull();
        elecCat!.TotalRevenue.Should().Be(2000m);
        elecCat.Percentage.Should().Be(66.67);
    }
}
