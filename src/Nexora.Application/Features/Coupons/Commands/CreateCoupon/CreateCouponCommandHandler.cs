using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Coupons.Dtos;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Coupons.Commands.CreateCoupon;

public sealed class CreateCouponCommandHandler : IRequestHandler<CreateCouponCommand, Result<CouponDto>>
{
    private readonly IApplicationDbContext _context;

    public CreateCouponCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CouponDto>> Handle(CreateCouponCommand request, CancellationToken cancellationToken)
    {
        var normalizedCode = request.Code.Trim().ToUpper();

        var existingCoupon = await _context.Coupons
            .AnyAsync(c => c.Code == normalizedCode && !c.IsDeleted, cancellationToken);

        if (existingCoupon)
        {
            throw new ConflictException($"'{normalizedCode}' koduna sahip bir kupon zaten mevcuttur.");
        }

        var coupon = new Coupon
        {
            Code = normalizedCode,
            DiscountType = request.DiscountType,
            DiscountValue = request.DiscountValue,
            MinimumOrderAmount = request.MinimumOrderAmount,
            MaximumDiscountAmount = request.MaximumDiscountAmount,
            TotalUsageLimit = request.TotalUsageLimit,
            CurrentUsageCount = 0,
            ExpirationDateUtc = request.ExpirationDateUtc,
            IsActive = true,
            IsDeleted = false
        };

        _context.Coupons.Add(coupon);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = new CouponDto(
            coupon.Id,
            coupon.Code,
            coupon.DiscountType.ToString(),
            coupon.DiscountValue,
            coupon.MinimumOrderAmount,
            coupon.MaximumDiscountAmount,
            coupon.TotalUsageLimit,
            coupon.CurrentUsageCount,
            coupon.ExpirationDateUtc,
            coupon.IsActive);

        return Result<CouponDto>.Success(dto, "Kupon başarıyla oluşturuldu.");
    }
}
