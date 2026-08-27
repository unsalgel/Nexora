using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Coupons.Commands.DeleteCoupon;

public sealed class DeleteCouponCommandHandler : IRequestHandler<DeleteCouponCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;

    public DeleteCouponCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(DeleteCouponCommand request, CancellationToken cancellationToken)
    {
        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Id == request.Id && !c.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Silinmek istenen kupon bulunamadı.");

        coupon.IsDeleted = true;
        coupon.IsActive = false;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success(coupon.Code, "Kupon başarıyla silindi.");
    }
}
