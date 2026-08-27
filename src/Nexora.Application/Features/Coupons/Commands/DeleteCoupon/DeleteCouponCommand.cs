using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Coupons.Commands.DeleteCoupon;

public sealed record DeleteCouponCommand(Guid Id) : IRequest<Result<string>>;
