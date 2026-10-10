using FluentValidation;

namespace Nexora.Application.Features.Settings.Commands.UpdateSiteSettings;

public sealed class UpdateSiteSettingsCommandValidator : AbstractValidator<UpdateSiteSettingsCommand>
{
    public UpdateSiteSettingsCommandValidator()
    {
        RuleFor(x => x.SiteTitle).NotEmpty().MaximumLength(150).WithMessage("Site başlığı zorunludur ve 150 karakteri aşamaz.");
        RuleFor(x => x.ContactEmail).NotEmpty().EmailAddress().MaximumLength(254).WithMessage("Geçerli bir iletişim e-postası giriniz.");
        RuleFor(x => x.ContactPhone).NotEmpty().Matches("^[+0-9 ()-]{10,20}$").WithMessage("Geçerli bir iletişim telefonu giriniz.");
        RuleFor(x => x.FreeShippingThreshold).GreaterThanOrEqualTo(0).PrecisionScale(18, 2, true).WithMessage("Ücretsiz kargo eşiği geçerli ve negatif olmayan bir tutar olmalıdır.");
        RuleFor(x => x.ShippingCost).GreaterThanOrEqualTo(0).PrecisionScale(18, 2, true).WithMessage("Kargo ücreti geçerli ve negatif olmayan bir tutar olmalıdır.");
        RuleFor(x => x.AnnouncementText).MaximumLength(2000).WithMessage("Duyuru 2000 karakteri aşamaz.");
    }
}
