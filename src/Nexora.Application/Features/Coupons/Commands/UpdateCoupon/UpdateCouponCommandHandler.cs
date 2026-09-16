using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Coupons.Dtos;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Coupons.Commands.UpdateCoupon;

public sealed class UpdateCouponCommandHandler : IRequestHandler<UpdateCouponCommand, Result<CouponDto>>
{
    private readonly IApplicationDbContext _context;

    public UpdateCouponCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CouponDto>> Handle(UpdateCouponCommand request, CancellationToken cancellationToken)
    {
        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Id == request.Id && !c.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Güncellenmek istenen kupon bulunamadı.");

        var normalizedCode = request.Code.Trim().ToUpper();

        var duplicateCode = await _context.Coupons
            .AnyAsync(c => c.Code == normalizedCode && c.Id != request.Id && !c.IsDeleted, cancellationToken);

        if (duplicateCode)
        {
            throw new ConflictException($"'{normalizedCode}' koduna sahip başka bir kupon zaten mevcuttur.");
        }

        coupon.Code = normalizedCode;
        coupon.DiscountType = request.DiscountType;
        coupon.DiscountValue = request.DiscountValue;
        coupon.MinimumOrderAmount = request.MinimumOrderAmount;
        coupon.MaximumDiscountAmount = request.MaximumDiscountAmount;
        coupon.TotalUsageLimit = request.TotalUsageLimit;
        coupon.ExpirationDateUtc = request.ExpirationDateUtc;
        coupon.IsActive = request.IsActive;

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

        return Result<CouponDto>.Success(dto, "Kupon başarıyla güncellendi.");
    }
}
