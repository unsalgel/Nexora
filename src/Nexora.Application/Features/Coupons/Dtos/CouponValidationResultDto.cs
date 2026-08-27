namespace Nexora.Application.Features.Coupons.Dtos;

public sealed record CouponValidationResultDto(
    bool IsValid,
    string CouponCode,
    string DiscountType,
    decimal DiscountValue,
    decimal CalculatedDiscountAmount,
    decimal OriginalTotalAmount,
    decimal FinalTotalAmount,
    string Message);
