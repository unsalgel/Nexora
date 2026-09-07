using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Coupons.Commands.UpdateCouponStatus;

public sealed class UpdateCouponStatusCommandHandler : IRequestHandler<UpdateCouponStatusCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;

    public UpdateCouponStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(UpdateCouponStatusCommand request, CancellationToken cancellationToken)
    {
        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Id == request.Id && !c.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Kupon bulunamadı.");

        coupon.IsActive = request.IsActive;
        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success("Kupon durumu başarıyla güncellendi.");
    }
}
