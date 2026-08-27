using Nexora.Domain.Enums;

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
}
