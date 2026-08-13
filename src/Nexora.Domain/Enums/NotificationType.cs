namespace Nexora.Domain.Enums;

public enum NotificationType
{
    /// <summary>
    /// Yeni bir sipariş başarıyla oluşturulduğunda gönderilen bildirim.
    /// </summary>
    OrderCreated = 1,

    /// <summary>
    /// Sipariş durumu güncellendiğinde (Kargoya verildi, Teslim edildi vb.) gönderilen bildirim.
    /// </summary>
    OrderStatusUpdated = 2,

    /// <summary>
    /// Ödeme işlemi başarıyla tamamlandığında gönderilen bildirim.
    /// </summary>
    PaymentSuccess = 3,

    /// <summary>
    /// Ödeme işlemi başarısız olduğunda gönderilen bildirim.
    /// </summary>
    PaymentFailed = 4,

    /// <summary>
    /// Genel sistem bildirimleri.
    /// </summary>
    System = 5
}
