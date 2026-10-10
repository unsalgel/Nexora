using System.Globalization;
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
        var settings = await context.Settings.AsNoTracking()
            .Where(s => s.Key == "FreeShippingThreshold" || s.Key == "ShippingCost")
            .ToDictionaryAsync(s => s.Key, s => s.Value, cancellationToken);
        var threshold = decimal.TryParse(settings.GetValueOrDefault("FreeShippingThreshold"), NumberStyles.Number, CultureInfo.InvariantCulture, out var parsedThreshold) ? parsedThreshold : 500m;
        var shippingCost = decimal.TryParse(settings.GetValueOrDefault("ShippingCost"), NumberStyles.Number, CultureInfo.InvariantCulture, out var parsedCost) ? parsedCost : 29.90m;
        if (threshold < 0 || shippingCost < 0) throw new ConflictException("Kargo ayarları geçersizdir.");
        var shipping = subtotal == 0 || subtotal >= threshold ? 0 : Math.Round(shippingCost, 2, MidpointRounding.AwayFromZero);
        var total = Math.Round(subtotal + shipping - discount, 2, MidpointRounding.AwayFromZero);
        return (new CartQuoteDto(subtotal, shipping, discount, total, coupon?.Code), coupon);
    }
}
