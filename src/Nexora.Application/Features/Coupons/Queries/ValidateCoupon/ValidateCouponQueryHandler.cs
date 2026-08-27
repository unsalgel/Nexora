using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Coupons.Dtos;
using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Coupons.Queries.ValidateCoupon;

public sealed class ValidateCouponQueryHandler 
    : IRequestHandler<ValidateCouponQuery, Result<CouponValidationResultDto>>
{
    private readonly IApplicationDbContext _context;

    public ValidateCouponQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CouponValidationResultDto>> Handle(
        ValidateCouponQuery request, 
        CancellationToken cancellationToken)
    {
        var normalizedCode = request.Code.Trim().ToUpper();

        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Code == normalizedCode && !c.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Geçersiz veya bulunamayan kupon kodu.");

        if (!coupon.IsActive)
        {
            throw new ConflictException("Bu kupon şu anda aktif değildir.");
        }

        if (coupon.ExpirationDateUtc < DateTime.UtcNow)
        {
            throw new ConflictException("Bu kuponun kullanım süresi dolmuştur.");
        }

        if (coupon.CurrentUsageCount >= coupon.TotalUsageLimit)
        {
            throw new ConflictException("Bu kupon maksimum kullanım limitine ulaşmıştır.");
        }

        if (request.CartTotalAmount < coupon.MinimumOrderAmount)
        {
            throw new ConflictException($"Bu kupon yalnızca {coupon.MinimumOrderAmount:N2} TL ve üzeri siparişlerde geçerlidir.");
        }

        decimal calculatedDiscount;

        if (coupon.DiscountType == DiscountType.Percentage)
        {
            calculatedDiscount = (request.CartTotalAmount * coupon.DiscountValue) / 100m;

            if (coupon.MaximumDiscountAmount.HasValue && calculatedDiscount > coupon.MaximumDiscountAmount.Value)
            {
                calculatedDiscount = coupon.MaximumDiscountAmount.Value;
            }
        }
        else
        {
            calculatedDiscount = coupon.DiscountValue;
        }

        if (calculatedDiscount > request.CartTotalAmount)
        {
            calculatedDiscount = request.CartTotalAmount;
        }

        var finalTotalAmount = request.CartTotalAmount - calculatedDiscount;

        var resultDto = new CouponValidationResultDto(
            IsValid: true,
            CouponCode: coupon.Code,
            DiscountType: coupon.DiscountType.ToString(),
            DiscountValue: coupon.DiscountValue,
            CalculatedDiscountAmount: calculatedDiscount,
            OriginalTotalAmount: request.CartTotalAmount,
            FinalTotalAmount: finalTotalAmount,
            Message: "Kupon başarıyla uygulandı.");

        return Result<CouponValidationResultDto>.Success(resultDto, "Kupon başarıyla uygulandı.");
    }
}
