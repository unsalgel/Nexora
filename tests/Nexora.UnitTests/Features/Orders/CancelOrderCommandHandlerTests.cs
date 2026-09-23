using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Orders.Commands.CancelOrder;
using Nexora.Domain.Entities;
using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Orders;

public sealed class CancelOrderCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;
    private readonly Mock<IRealTimeNotificationService> _notificationServiceMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<ILogger<CancelOrderCommandHandler>> _loggerMock;
    private readonly CancelOrderCommandHandler _handler;

    public CancelOrderCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
        _notificationServiceMock = new Mock<IRealTimeNotificationService>();
        _emailServiceMock = new Mock<IEmailService>();
        _loggerMock = new Mock<ILogger<CancelOrderCommandHandler>>();

        _handler = new CancelOrderCommandHandler(
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
    public async Task Handle_WhenOrderBelongsToAnotherUser_ThrowsNotFoundException()
    {
        var ownerId = Guid.NewGuid();
        var callerId = Guid.NewGuid(); // Başka kullanıcı

        var order = new Order
        {
            OrderNumber = "NX-TEST-101",
            UserId = ownerId,
            ShippingAddress = "Adres",
            TotalAmount = 500,
            Status = OrderStatus.Paid
        };
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var command = new CancelOrderCommand(order.Id, callerId);

        var act = async () => await _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("İptal edilecek sipariş bulunamadı.");
    }

    [Fact]
    public async Task Handle_WhenOrderAlreadyShipped_ThrowsConflictException()
    {
        var userId = Guid.NewGuid();
        var order = new Order
        {
            OrderNumber = "NX-TEST-102",
            UserId = userId,
            ShippingAddress = "Adres",
            TotalAmount = 800,
            Status = OrderStatus.Shipped // Kargoda
        };
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var command = new CancelOrderCommand(order.Id, userId);

        var act = async () => await _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("Hazırlanmakta olan veya kargoya verilmiş siparişler iptal edilemez. Lütfen müşteri hizmetleri ile iletişime geçiniz.");
    }

    [Fact]
    public async Task Handle_WhenValidOrder_CancelsAndRestoresStockSuccessfully()
    {
        var user = new User { FirstName = "Burak", LastName = "Yılmaz", Email = "burak@nexora.com", PasswordHash = "hash" };
        _context.Users.Add(user);

        var product = new Product { Name = "Kulaklık", SKU = "KUL-01", Price = 1000, StockQuantity = 3, IsActive = true };
        _context.Products.Add(product);

        var order = new Order
        {
            OrderNumber = "NX-TEST-103",
            UserId = user.Id,
            ShippingAddress = "Adres",
            TotalAmount = 2000,
            Status = OrderStatus.Paid
        };
        order.Items.Add(new OrderItem
        {
            Product = product,
            ProductName = product.Name,
            UnitPrice = 1000,
            Quantity = 2,
            TotalPrice = 2000
        });
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var command = new CancelOrderCommand(order.Id, user.Id);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().Be("Siparişiniz başarıyla iptal edildi.");
        order.Status.Should().Be(OrderStatus.Cancelled);
        product.StockQuantity.Should().Be(5); // 3 + 2 iade edildi
    }
}
