namespace Nexora.Domain.Enums;

public enum PaymentStatus
{
    Pending = 1,
    Success = 2,
    Failed = 3,
    Refunded = 4,
    Unknown = 5,
    UnderReview = 6,
    RequiresAttention = 7
}
