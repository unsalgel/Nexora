using FluentValidation;
using Nexora.Domain.Enums;

namespace Nexora.Application.Features.Coupons.Commands.UpdateCoupon;

public sealed class UpdateCouponCommandValidator : AbstractValidator<UpdateCouponCommand>
{
    public UpdateCouponCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Kupon kimliği zorunludur.");
        RuleFor(x => x.Code).NotEmpty().MaximumLength(50).Matches("^[A-Za-z0-9_-]+$").WithMessage("Kupon kodu 1–50 harf, rakam, tire veya alt çizgi içermelidir.");
        RuleFor(x => x.DiscountType).IsInEnum().WithMessage("Geçersiz indirim tipi.");
        RuleFor(x => x.DiscountValue).GreaterThan(0).PrecisionScale(18, 2, true).WithMessage("İndirim değeri pozitif ve en fazla iki ondalık basamaklı olmalıdır.");
        RuleFor(x => x.DiscountValue).LessThanOrEqualTo(100).When(x => x.DiscountType == DiscountType.Percentage).WithMessage("Yüzde indirimi 100'ü aşamaz.");
        RuleFor(x => x.MinimumOrderAmount).GreaterThanOrEqualTo(0).PrecisionScale(18, 2, true).WithMessage("Minimum sepet tutarı geçerli ve negatif olmayan bir tutar olmalıdır.");
        RuleFor(x => x.MaximumDiscountAmount).GreaterThanOrEqualTo(0).PrecisionScale(18, 2, true).WithMessage("Maksimum indirim geçerli, negatif olmayan ve en fazla iki ondalık basamaklı bir tutar olmalıdır.");
        RuleFor(x => x.TotalUsageLimit).GreaterThan(0).WithMessage("Kullanım limiti pozitif olmalıdır.");
        RuleFor(x => x.ExpirationDateUtc).Must(x => x.Kind == DateTimeKind.Utc).WithMessage("Son kullanım tarihi UTC olmalıdır.");
    }
}
