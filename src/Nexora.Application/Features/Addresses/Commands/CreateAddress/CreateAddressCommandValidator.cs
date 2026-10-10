using FluentValidation;

namespace Nexora.Application.Features.Addresses.Commands.CreateAddress;

public sealed class CreateAddressCommandValidator : AbstractValidator<CreateAddressCommand>
{
    public CreateAddressCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty().WithMessage("Kullanıcı kimliği zorunludur.");
        RuleFor(x => x.Title).NotEmpty().MaximumLength(100).WithMessage("Adres başlığı zorunludur ve 100 karakteri aşamaz.");
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200).WithMessage("Ad soyad zorunludur ve 200 karakteri aşamaz.");
        RuleFor(x => x.PhoneNumber).NotEmpty().Matches("^[+0-9 ()-]{10,20}$").WithMessage("Geçerli bir telefon numarası giriniz.");
        RuleFor(x => x.City).NotEmpty().MaximumLength(100).WithMessage("İl zorunludur ve 100 karakteri aşamaz.");
        RuleFor(x => x.District).NotEmpty().MaximumLength(100).WithMessage("İlçe zorunludur ve 100 karakteri aşamaz.");
        RuleFor(x => x.DetailedAddress).NotEmpty().MaximumLength(1000).WithMessage("Adres zorunludur ve 1000 karakteri aşamaz.");
        RuleFor(x => x.PostalCode).Matches("^[0-9]{5}$").When(x => !string.IsNullOrEmpty(x.PostalCode)).WithMessage("Posta kodu beş haneli olmalıdır.");
    }
}
