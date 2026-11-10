using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Payments.Dtos;

namespace Nexora.Application.Features.Payments.Queries.GetPaymentStatus;

public sealed record GetPaymentStatusQuery(Guid UserId, string OrderNumber) : IRequest<Result<PaymentStatusDto>>;