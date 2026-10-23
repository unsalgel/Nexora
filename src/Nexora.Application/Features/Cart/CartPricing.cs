using Nexora.Application.Features.Settings;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Cart.Dtos;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Cart;

public static class CartPricing
{
    public static async Task<(CartQuoteDto Quote, Coupon? Coupon)> CalculateAsync(
        IApplicationDbContext context, decimal subtotal, string? couponCode, CancellationToken cancellationToken)
    {
        subtotal = Math.Round(subtotal, 2, MidpointRounding.AwayFromZero);
        Coupon? coupon = null;
        decimal discount = 0;
        if (!string.IsNullOrWhiteSpace(couponCode))
        {
            var code = couponCode.Trim().ToUpperInvariant();
            coupon = await context.Coupons.FirstOrDefaultAsync(c => c.Code == code && !c.IsDeleted, cancellationToken)
                ?? throw new ConflictException("Kupon bulunamadı.");
            discount = coupon.CalculateDiscount(subtotal, DateTime.UtcNow);
        }
        var policy = await ShippingPolicy.LoadAsync(context, cancellationToken);
        var shipping = policy.CalculateFee(subtotal);
        var total = Math.Round(subtotal + shipping - discount, 2, MidpointRounding.AwayFromZero);
        return (new CartQuoteDto(subtotal, shipping, discount, total, coupon?.Code), coupon);
    }
}
