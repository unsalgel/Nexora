using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Settings;

public sealed record ShippingPolicy(decimal FreeShippingThreshold, decimal ShippingCost)
{
    public static ShippingPolicy FromSettings(IReadOnlyDictionary<string, string> values)
    {
        var threshold = decimal.TryParse(values.GetValueOrDefault("FreeShippingThreshold"), NumberStyles.Number, CultureInfo.InvariantCulture, out var t) ? t : 500m;
        var cost = decimal.TryParse(values.GetValueOrDefault("ShippingCost"), NumberStyles.Number, CultureInfo.InvariantCulture, out var c) ? c : 29.90m;
        if (threshold < 0 || cost < 0) throw new ConflictException("Kargo ayarları geçersizdir.");
        return new ShippingPolicy(threshold, cost);
    }

    public static async Task<ShippingPolicy> LoadAsync(IApplicationDbContext context, CancellationToken ct) =>
        FromSettings(await context.Settings.AsNoTracking()
            .Where(s => s.Key == "FreeShippingThreshold" || s.Key == "ShippingCost")
            .ToDictionaryAsync(s => s.Key, s => s.Value, ct));

    public decimal CalculateFee(decimal subtotal) => subtotal == 0 || subtotal >= FreeShippingThreshold
        ? 0 : Math.Round(ShippingCost, 2, MidpointRounding.AwayFromZero);
}
