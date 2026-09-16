using FluentAssertions;
using Nexora.Application.Features.Coupons.Commands.UpdateCoupon;
using Nexora.Domain.Entities;
using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Coupons;

public sealed class UpdateCouponCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;
    private readonly UpdateCouponCommandHandler _handler;

    public UpdateCouponCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
        _handler = new UpdateCouponCommandHandler(_context);
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task Handle_ValidUpdate_UpdatesCouponFieldsSuccessfully()
    {
        var coupon = new Coupon
        {
            Id = Guid.NewGuid(),
            Code = "OLDCODE",
            DiscountType = DiscountType.Percentage,
            DiscountValue = 10,
            MinimumOrderAmount = 100,
            TotalUsageLimit = 50,
            ExpirationDateUtc = DateTime.UtcNow.AddDays(5),
            IsActive = true
        };
        _context.Coupons.Add(coupon);
        await _context.SaveChangesAsync();

        var newDate = DateTime.UtcNow.AddDays(30);
        var command = new UpdateCouponCommand(
            coupon.Id,
            "NEWCODE",
            DiscountType.FixedAmount,
            150,
            500,
            null,
            200,
            newDate,
            true);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data!.Code.Should().Be("NEWCODE");
        result.Data.DiscountValue.Should().Be(150);
        result.Data.TotalUsageLimit.Should().Be(200);

        var updated = await _context.Coupons.FindAsync(coupon.Id);
        updated!.Code.Should().Be("NEWCODE");
        updated.DiscountType.Should().Be(DiscountType.FixedAmount);
    }

    [Fact]
    public async Task Handle_DuplicateCodeOnAnotherCoupon_ThrowsConflictException()
    {
        var c1 = new Coupon { Id = Guid.NewGuid(), Code = "CODE1", ExpirationDateUtc = DateTime.UtcNow.AddDays(1) };
        var c2 = new Coupon { Id = Guid.NewGuid(), Code = "CODE2", ExpirationDateUtc = DateTime.UtcNow.AddDays(1) };
        _context.Coupons.AddRange(c1, c2);
        await _context.SaveChangesAsync();

        var command = new UpdateCouponCommand(
            c2.Id,
            "CODE1",
            DiscountType.Percentage,
            10,
            100,
            null,
            100,
            DateTime.UtcNow.AddDays(10),
            true);

        var act = () => _handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<ConflictException>();
    }
}
