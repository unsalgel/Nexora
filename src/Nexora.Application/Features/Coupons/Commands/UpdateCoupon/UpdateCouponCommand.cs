using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Coupons.Dtos;
using Nexora.Domain.Enums;

namespace Nexora.Application.Features.Coupons.Commands.UpdateCoupon;

public sealed record UpdateCouponCommand(
    Guid Id,
    string Code,
    DiscountType DiscountType,
    decimal DiscountValue,
    decimal MinimumOrderAmount,
    decimal? MaximumDiscountAmount,
    int TotalUsageLimit,
    DateTime ExpirationDateUtc,
    bool IsActive) : IRequest<Result<CouponDto>>;
