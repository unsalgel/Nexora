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
        var normalizedCode = request.Code.Trim().ToUpperInvariant();

        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Code == normalizedCode && !c.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Geçersiz veya bulunamayan kupon kodu.");

        var calculatedDiscount = coupon.CalculateDiscount(request.CartTotalAmount, DateTime.UtcNow);

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
