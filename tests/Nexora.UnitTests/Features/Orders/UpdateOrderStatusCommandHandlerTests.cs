using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Orders.Commands.UpdateOrderStatus;
using Nexora.Domain.Entities;
using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Orders;

public sealed class UpdateOrderStatusCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;
    private readonly Mock<IRealTimeNotificationService> _notificationServiceMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<ILogger<UpdateOrderStatusCommandHandler>> _loggerMock;
    private readonly UpdateOrderStatusCommandHandler _handler;

    public UpdateOrderStatusCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
        _notificationServiceMock = new Mock<IRealTimeNotificationService>();
        _emailServiceMock = new Mock<IEmailService>();
        _loggerMock = new Mock<ILogger<UpdateOrderStatusCommandHandler>>();

        _handler = new UpdateOrderStatusCommandHandler(
            _context,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task Handle_WhenOrderNotFound_ThrowsNotFoundException()
    {
        var command = new UpdateOrderStatusCommand(Guid.NewGuid(), OrderStatus.Shipped, "TRK123", "Aras Kargo");

        var act = async () => await _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("Sipariş bulunamadı.");
    }

    [Fact]
    public async Task Handle_WhenOrderAlreadyCancelled_ThrowsConflictException()
    {
        var user = new User { FirstName = "Test", LastName = "User", Email = "test@test.com", PasswordHash = "h" };
        _context.Users.Add(user);
        var order = new Order
        {
            OrderNumber = "NX-TEST-001",
            UserId = user.Id,
            User = user,
            ShippingAddress = "Adres",
            TotalAmount = 500,
            Status = OrderStatus.Cancelled
        };
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var command = new UpdateOrderStatusCommand(order.Id, OrderStatus.Shipped, null, null);

        var act = async () => await _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("İptal edilmiş bir siparişin durumu değiştirilemez.");
    }

    [Fact]
    public async Task Handle_WhenValidStatusTransition_UpdatesStatusSuccessfully()
    {
        var user = new User
        {
            FirstName = "Ali",
            LastName = "Veli",
            Email = "ali@nexora.com",
            PasswordHash = "hash"
        };
        _context.Users.Add(user);

        var order = new Order
        {
            OrderNumber = "NX-TEST-002",
            UserId = user.Id,
            ShippingAddress = "Adres",
            TotalAmount = 1000,
            Status = OrderStatus.Processing
        };
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var command = new UpdateOrderStatusCommand(order.Id, OrderStatus.Shipped, "TRK999", "Yurtiçi Kargo");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        order.Status.Should().Be(OrderStatus.Shipped);
        order.TrackingNumber.Should().Be("TRK999");
        order.Carrier.Should().Be("Yurtiçi Kargo");
    }

    [Fact]
    public async Task Handle_WhenCancelled_RestoresProductStock()
    {
        var user = new User { FirstName = "Ayşe", LastName = "Yılmaz", Email = "ayse@nexora.com", PasswordHash = "hash" };
        _context.Users.Add(user);

        var product = new Product { Name = "Monitör", SKU = "PRD-MON-001", Price = 4000, StockQuantity = 5, IsActive = true };
        _context.Products.Add(product);

        var order = new Order
        {
            OrderNumber = "NX-TEST-003",
            UserId = user.Id,
            ShippingAddress = "Adres",
            TotalAmount = 4000,
            Status = OrderStatus.Pending
        };
        order.Items.Add(new OrderItem
        {
            Product = product,
            ProductName = product.Name,
            UnitPrice = 4000,
            Quantity = 2,
            TotalPrice = 8000
        });
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var command = new UpdateOrderStatusCommand(order.Id, OrderStatus.Cancelled, null, null);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        product.StockQuantity.Should().Be(7); // 5 + 2 geri yüklendi
        order.Status.Should().Be(OrderStatus.Cancelled);
    }
}
