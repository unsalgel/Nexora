using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Coupons.Dtos;

namespace Nexora.Application.Features.Coupons.Queries.GetAllCoupons;

public sealed record GetAllCouponsQuery : IRequest<Result<IReadOnlyList<CouponDto>>>;
