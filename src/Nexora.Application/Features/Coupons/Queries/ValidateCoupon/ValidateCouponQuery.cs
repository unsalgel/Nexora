using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Coupons.Dtos;

namespace Nexora.Application.Features.Coupons.Queries.ValidateCoupon;

public sealed record ValidateCouponQuery(string Code, decimal CartTotalAmount) 
    : IRequest<Result<CouponValidationResultDto>>;
