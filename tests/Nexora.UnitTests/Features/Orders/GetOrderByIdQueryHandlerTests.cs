using FluentAssertions;
using Nexora.Application.Features.Orders.Queries.GetOrderById;
using Nexora.Domain.Entities;
using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Orders;

public sealed class GetOrderByIdQueryHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;
    private readonly GetOrderByIdQueryHandler _handler;

    public GetOrderByIdQueryHandlerTests()
    {
        _context = TestDbContextFactory.Create();
        _handler = new GetOrderByIdQueryHandler(_context);
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task Handle_WhenOrderBelongsToDifferentUser_ThrowsUnauthorizedException()
    {
        var ownerId = Guid.NewGuid();
        var attackerId = Guid.NewGuid();

        var order = new Order
        {
            OrderNumber = "NX-TEST-IDOR-01",
            UserId = ownerId,
            ShippingAddress = "Kadıköy, İstanbul",
            TotalAmount = 750,
            Status = OrderStatus.Paid,
            PaymentStatus = PaymentStatus.Success
        };
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var query = new GetOrderByIdQuery(order.Id, attackerId);

        var act = async () => await _handler.Handle(query, CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("Bu siparişi görüntüleme yetkiniz bulunmamaktadır.");
    }

    [Fact]
    public async Task Handle_WhenOrderBelongsToOwner_ReturnsOrderDtoSuccessfully()
    {
        var ownerId = Guid.NewGuid();

        var order = new Order
        {
            OrderNumber = "NX-TEST-OWNER-02",
            UserId = ownerId,
            ShippingAddress = "Çankaya, Ankara",
            TotalAmount = 1200,
            Status = OrderStatus.Shipped,
            PaymentStatus = PaymentStatus.Success,
            Items = new List<OrderItem>
            {
                new()
                {
                    ProductId = Guid.NewGuid(),
                    ProductName = "Kablosuz Kulaklık",
                    UnitPrice = 1200,
                    Quantity = 1,
                    TotalPrice = 1200
                }
            }
        };
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var query = new GetOrderByIdQuery(order.Id, ownerId);

        var result = await _handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.OrderNumber.Should().Be("NX-TEST-OWNER-02");
        result.Data.UserId.Should().Be(ownerId);
        result.Data.Items.Should().HaveCount(1);
    }

    [Fact]
    public async Task Handle_WhenOrderDoesNotExist_ThrowsNotFoundException()
    {
        var query = new GetOrderByIdQuery(Guid.NewGuid(), Guid.NewGuid());

        var act = async () => await _handler.Handle(query, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("Sipariş bulunamadı.");
    }
}
