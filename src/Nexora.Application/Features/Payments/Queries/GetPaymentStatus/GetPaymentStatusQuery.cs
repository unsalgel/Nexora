using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Payments.Queries.GetPaymentStatus;

public sealed record PaymentStatusDto(string OrderNumber, string PaymentStatus);
public sealed record GetPaymentStatusQuery(Guid UserId, string OrderNumber) : IRequest<Result<PaymentStatusDto>>;

public sealed class GetPaymentStatusQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetPaymentStatusQuery, Result<PaymentStatusDto>>
{
    public async Task<Result<PaymentStatusDto>> Handle(GetPaymentStatusQuery request, CancellationToken cancellationToken)
    {
        var order = await context.Orders.AsNoTracking().SingleOrDefaultAsync(
            o => o.UserId == request.UserId && o.OrderNumber == request.OrderNumber && o.PaymentToken != null, cancellationToken)
            ?? throw new NotFoundException("Ödeme kaydı bulunamadı.");
        return Result<PaymentStatusDto>.Success(new(order.OrderNumber, order.PaymentStatus.ToString()));
    }
}