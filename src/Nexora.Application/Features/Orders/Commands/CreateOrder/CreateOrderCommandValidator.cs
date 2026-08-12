using FluentValidation;

namespace Nexora.Application.Features.Orders.Commands.CreateOrder;

public sealed class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Kullanıcı kimliği boş bırakılamaz.");

        RuleFor(x => x.ShippingAddress)
            .NotEmpty().WithMessage("Teslimat adresi zorunludur.")
            .MinimumLength(10).WithMessage("Teslimat adresi en az 10 karakter olmalıdır.");

        RuleFor(x => x.PaymentInfo)
            .NotNull().WithMessage("Ödeme bilgileri gereklidir.");

        When(x => x.PaymentInfo != null, () =>
        {
            RuleFor(x => x.PaymentInfo.CardHolderName)
                .NotEmpty().WithMessage("Kart üzerindeki isim zorunludur.");

            RuleFor(x => x.PaymentInfo.CardNumber)
                .NotEmpty().WithMessage("Kart numarası zorunludur.")
                .Matches(@"^\d{16}$").WithMessage("Geçerli bir 16 haneli kart numarası giriniz.");

            RuleFor(x => x.PaymentInfo.ExpirationMonth)
                .NotEmpty().WithMessage("Son kullanma ayı zorunludur.");

            RuleFor(x => x.PaymentInfo.ExpirationYear)
                .NotEmpty().WithMessage("Son kullanma yılı zorunludur.");

            RuleFor(x => x.PaymentInfo.Cvv)
                .NotEmpty().WithMessage("CVV güvenlik kodu zorunludur.")
                .Matches(@"^\d{3,4}$").WithMessage("CVV 3 veya 4 haneli sayı olmalıdır.");
        });
    }
}
