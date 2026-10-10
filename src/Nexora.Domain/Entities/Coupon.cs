using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;

namespace Nexora.Domain.Entities;

public sealed class Coupon : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public DiscountType DiscountType { get; set; } // İndirim Tipi (Yüzde ya da Sabit Tutar)
    public decimal DiscountValue { get; set; } // İndirim Oranı veya Tutarı
    public decimal MinimumOrderAmount { get; set; } = 0; // Min Sipariş Tutarı
    public decimal? MaximumDiscountAmount { get; set; } // Maksimum İndirim Tutarı
    public int TotalUsageLimit { get; set; } = 100; // Toplam Kullanım Limiti
    public int CurrentUsageCount { get; set; } = 0; // Mevcut Kullanım Sayısı
    public DateTime ExpirationDateUtc { get; set; } // Geçerlilik Sonu
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;

    public decimal CalculateDiscount(decimal subtotal, DateTime utcNow)
    {
        if (subtotal < 0 || !IsActive || IsDeleted || ExpirationDateUtc <= utcNow ||
            TotalUsageLimit <= 0 || CurrentUsageCount >= TotalUsageLimit)
            throw new ConflictException("Kupon geçersiz, süresi dolmuş veya kullanım limiti dolmuştur.");
        if (!Enum.IsDefined(DiscountType) || DiscountValue <= 0 ||
            (DiscountType == DiscountType.Percentage && DiscountValue > 100) ||
            MinimumOrderAmount < 0 || MaximumDiscountAmount < 0)
            throw new ConflictException("Kupon indirim ayarları geçersizdir.");
        if (subtotal < MinimumOrderAmount)
            throw new ConflictException($"Bu kupon için sepet tutarı en az {MinimumOrderAmount:N2} TL olmalıdır.");
        var discount = DiscountType == DiscountType.Percentage ? subtotal * DiscountValue / 100m : DiscountValue;
        if (MaximumDiscountAmount.HasValue) discount = Math.Min(discount, MaximumDiscountAmount.Value);
        return Math.Round(Math.Clamp(discount, 0m, subtotal), 2, MidpointRounding.AwayFromZero);
    }
}
