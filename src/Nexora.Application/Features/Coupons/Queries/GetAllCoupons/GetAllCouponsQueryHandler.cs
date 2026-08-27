using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Coupons.Dtos;

namespace Nexora.Application.Features.Coupons.Queries.GetAllCoupons;

public sealed class GetAllCouponsQueryHandler : IRequestHandler<GetAllCouponsQuery, Result<IReadOnlyList<CouponDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetAllCouponsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<IReadOnlyList<CouponDto>>> Handle(GetAllCouponsQuery request, CancellationToken cancellationToken)
    {
        var coupons = await _context.Coupons
            .Where(c => !c.IsDeleted)
            .OrderByDescending(c => c.CreatedAtUtc)
            .Select(c => new CouponDto(
                c.Id,
                c.Code,
                c.DiscountType.ToString(),
                c.DiscountValue,
                c.MinimumOrderAmount,
                c.MaximumDiscountAmount,
                c.TotalUsageLimit,
                c.CurrentUsageCount,
                c.ExpirationDateUtc,
                c.IsActive))
            .ToListAsync(cancellationToken);

        return Result<IReadOnlyList<CouponDto>>.Success(coupons, "Kuponlar başarıyla listelendi.");
    }
}
