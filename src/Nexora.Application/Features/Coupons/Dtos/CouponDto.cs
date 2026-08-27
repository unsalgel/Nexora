namespace Nexora.Application.Features.Coupons.Dtos;

public sealed record CouponDto(
    Guid Id,
    string Code,
    string DiscountType,
    decimal DiscountValue,
    decimal MinimumOrderAmount,
    decimal? MaximumDiscountAmount,
    int TotalUsageLimit,
    int CurrentUsageCount,
    DateTime ExpirationDateUtc,
    bool IsActive);
