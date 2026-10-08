using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Domain.Entities;
using Nexora.Domain.Enums;
using Nexora.Infrastructure.BackgroundJobs;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.BackgroundJobs;

public sealed class BackgroundJobTests : IDisposable
{
    private readonly NexoraDbContext _context;

    public BackgroundJobTests()
    {
        _context = TestDbContextFactory.Create();
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task ProcessExpiredCouponsAsync_DeactivatesExpiredAndExhaustedCoupons()
    {
        var expiredCoupon = new Coupon
        {
            Id = Guid.NewGuid(),
            Code = "EXPIRED",
            ExpirationDateUtc = DateTime.UtcNow.AddMinutes(-10),
            IsActive = true
        };

        var exhaustedCoupon = new Coupon
        {
            Id = Guid.NewGuid(),
            Code = "EXHAUSTED",
            ExpirationDateUtc = DateTime.UtcNow.AddDays(10),
            TotalUsageLimit = 5,
            CurrentUsageCount = 5,
            IsActive = true
        };

        var activeCoupon = new Coupon
        {
            Id = Guid.NewGuid(),
            Code = "ACTIVE",
            ExpirationDateUtc = DateTime.UtcNow.AddDays(10),
            TotalUsageLimit = 10,
            CurrentUsageCount = 1,
            IsActive = true
        };

        _context.Coupons.AddRange(expiredCoupon, exhaustedCoupon, activeCoupon);
        await _context.SaveChangesAsync();

        var loggerMock = new Mock<ILogger<CouponCleanupJob>>();
        var dbLoggerMock = new Mock<IDbLogger>();
        var job = new CouponCleanupJob(_context, loggerMock.Object, dbLoggerMock.Object);

        await job.ProcessExpiredCouponsAsync(CancellationToken.None);

        var updatedExpired = await _context.Coupons.FindAsync(expiredCoupon.Id);
        var updatedExhausted = await _context.Coupons.FindAsync(exhaustedCoupon.Id);
        var updatedActive = await _context.Coupons.FindAsync(activeCoupon.Id);

        updatedExpired!.IsActive.Should().BeFalse();
        updatedExhausted!.IsActive.Should().BeFalse();
        updatedActive!.IsActive.Should().BeTrue();

        dbLoggerMock.Verify(x => x.LogInformationAsync(
            "Hangfire.CouponCleanupJob",
            It.Is<string>(s => s.Contains("2 adet")),
            null,
            null,
            null,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CancelStalePendingOrdersAsync_CancelsOrdersOlderThan24HoursAndReturnsStock()
    {
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Test Ürün",
            SKU = "TEST-SKU",
            Price = 100,
            StockQuantity = 10,
            CategoryId = Guid.NewGuid(),
            BrandId = Guid.NewGuid()
        };
        _context.Products.Add(product);

        var staleOrder = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "NX-TEST-001",
            UserId = Guid.NewGuid(),
            ShippingAddress = "Test Adres",
            TotalAmount = 200,
            Status = OrderStatus.Pending,
            PaymentStatus = PaymentStatus.Pending,
            Items = new List<OrderItem>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    ProductName = "Test Ürün",
                    UnitPrice = 100,
                    Quantity = 2
                }
            }
        };

        var freshOrder = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "NX-TEST-002",
            UserId = Guid.NewGuid(),
            ShippingAddress = "Test Adres 2",
            TotalAmount = 100,
            Status = OrderStatus.Pending,
            PaymentStatus = PaymentStatus.Pending,
            Items = new List<OrderItem>()
        };

        _context.Orders.AddRange(staleOrder, freshOrder);
        await _context.SaveChangesAsync();

        staleOrder.CreatedAtUtc = DateTime.UtcNow.AddHours(-25);
        await _context.SaveChangesAsync();

        var loggerMock = new Mock<ILogger<OrderCleanupJob>>();
        var dbLoggerMock = new Mock<IDbLogger>();
        var job = new OrderCleanupJob(_context, loggerMock.Object, dbLoggerMock.Object);

        await job.CancelStalePendingOrdersAsync(CancellationToken.None);

        var updatedStaleOrder = await _context.Orders.FindAsync(staleOrder.Id);
        var updatedFreshOrder = await _context.Orders.FindAsync(freshOrder.Id);
        var updatedProduct = await _context.Products.FindAsync(product.Id);

        updatedStaleOrder!.Status.Should().Be(OrderStatus.Cancelled);
        updatedStaleOrder.PaymentStatus.Should().Be(PaymentStatus.Failed);
        updatedFreshOrder!.Status.Should().Be(OrderStatus.Pending);
        updatedProduct!.StockQuantity.Should().Be(12);

        dbLoggerMock.Verify(x => x.LogInformationAsync(
            "Hangfire.OrderCleanupJob",
            It.Is<string>(s => s.Contains("1 adet bekleyen sipariş")),
            null,
            null,
            null,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CleanupAbandonedCartsAsync_RemovesItemsOlderThan30Days()
    {
        var cart = new Cart
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid()
        };
        _context.Carts.Add(cart);

        var staleItem = new CartItem
        {
            Id = Guid.NewGuid(),
            CartId = cart.Id,
            ProductId = Guid.NewGuid(),
            Quantity = 1
        };

        var freshItem = new CartItem
        {
            Id = Guid.NewGuid(),
            CartId = cart.Id,
            ProductId = Guid.NewGuid(),
            Quantity = 2
        };

        _context.CartItems.AddRange(staleItem, freshItem);
        await _context.SaveChangesAsync();

        staleItem.CreatedAtUtc = DateTime.UtcNow.AddDays(-35);
        await _context.SaveChangesAsync();

        var loggerMock = new Mock<ILogger<CartCleanupJob>>();
        var dbLoggerMock = new Mock<IDbLogger>();
        var job = new CartCleanupJob(_context, loggerMock.Object, dbLoggerMock.Object);

        await job.CleanupAbandonedCartsAsync(CancellationToken.None);

        var staleInDb = await _context.CartItems.FindAsync(staleItem.Id);
        var freshInDb = await _context.CartItems.FindAsync(freshItem.Id);

        staleInDb.Should().BeNull();
        freshInDb.Should().NotBeNull();

        dbLoggerMock.Verify(x => x.LogInformationAsync(
            "Hangfire.CartCleanupJob",
            It.Is<string>(s => s.Contains("1 adet")),
            null,
            null,
            null,
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
