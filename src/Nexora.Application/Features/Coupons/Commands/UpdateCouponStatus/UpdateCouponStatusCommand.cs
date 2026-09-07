using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Coupons.Commands.UpdateCouponStatus;

public sealed record UpdateCouponStatusCommand(Guid Id, bool IsActive) : IRequest<Result<string>>;
