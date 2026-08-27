using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Coupons.Dtos;
using Nexora.Domain.Enums;

namespace Nexora.Application.Features.Coupons.Commands.CreateCoupon;

public sealed record CreateCouponCommand(
    string Code,
    DiscountType DiscountType,
    decimal DiscountValue,
    decimal MinimumOrderAmount,
    decimal? MaximumDiscountAmount,
    int TotalUsageLimit,
    DateTime ExpirationDateUtc) : IRequest<Result<CouponDto>>;
