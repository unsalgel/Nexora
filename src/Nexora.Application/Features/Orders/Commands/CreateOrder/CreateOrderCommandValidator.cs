using FluentValidation;

namespace Nexora.Application.Features.Orders.Commands.CreateOrder;

public sealed class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Kullanıcı kimliği boş olamaz.");

        RuleFor(x => x.ShippingAddress)
            .NotEmpty().WithMessage("Teslimat adresi boş olamaz.")
            .MaximumLength(1000).WithMessage("Teslimat adresi en fazla 1000 karakter olabilir.");

        RuleFor(x => x.PaymentInfo)
            .NotNull().WithMessage("Ödeme bilgileri gereklidir.");

        When(x => x.PaymentInfo is not null, () =>
        {
            RuleFor(x => x.PaymentInfo.CardNumber)
                .NotEmpty().WithMessage("Kart numarası boş olamaz.")
                .CreditCard().WithMessage("Geçersiz kredi kartı numarası.");

            RuleFor(x => x.PaymentInfo.CardHolderName)
                .NotEmpty().WithMessage("Kart üzerindeki isim boş olamaz.")
                .MaximumLength(100).WithMessage("Kart üzerindeki isim en fazla 100 karakter olabilir.");

            RuleFor(x => x.PaymentInfo.ExpirationMonth)
                .NotEmpty().WithMessage("Son kullanma ayı boş olamaz.")
                .Matches(@"^(0[1-9]|1[0-2])$").WithMessage("Son kullanma ayı 01 ile 12 arasında 2 haneli olmalıdır.");

            RuleFor(x => x.PaymentInfo.ExpirationYear)
                .NotEmpty().WithMessage("Son kullanma yılı boş olamaz.")
                .Matches(@"^\d{4}$").WithMessage("Son kullanma yılı 4 haneli olmalıdır.");

            RuleFor(x => x.PaymentInfo.Cvv)
                .NotEmpty().WithMessage("CVV boş olamaz.")
                .Matches(@"^\d{3,4}$").WithMessage("CVV 3 veya 4 haneli bir sayı olmalıdır.");
        });
    }
}