using FluentValidation;

namespace Nexora.Application.Features.Payments.Commands.InitializePayment;

public sealed class InitializePaymentCommandValidator : AbstractValidator<InitializePaymentCommand>
{
    public InitializePaymentCommandValidator()
    {
        RuleFor(x => x.IdempotencyKey)
            .NotEmpty().WithMessage("İşlem tekillik anahtarı boş bırakılamaz.")
            .MaximumLength(128).WithMessage("İşlem tekillik anahtarı en fazla 128 karakter olabilir.");

        RuleFor(x => x.BillingAddress)
            .MaximumLength(500).WithMessage("Fatura adresi en fazla 500 karakter olabilir.");

        RuleFor(x => x.CouponCode)
            .MaximumLength(50).WithMessage("Kupon kodu en fazla 50 karakter olabilir.");

        RuleFor(x => x.ExpectedTotalAmount)
            .GreaterThan(0).WithMessage("Beklenen toplam tutar sıfırdan büyük olmalıdır.")
            .When(x => x.ExpectedTotalAmount.HasValue);

        RuleFor(x => x.ShippingAddress)
            .NotEmpty().WithMessage("Teslimat adresi boş bırakılamaz.")
            .MaximumLength(500).WithMessage("Teslimat adresi en fazla 500 karakter olabilir.");

        RuleFor(x => x.ContactName)
            .MaximumLength(150).WithMessage("Teslimat alıcı adı en fazla 150 karakter olabilir.");

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(30).WithMessage("Telefon numarası en fazla 30 karakter olabilir.");

        RuleFor(x => x.City)
            .MaximumLength(100).WithMessage("Şehir bilgisi en fazla 100 karakter olabilir.");

        RuleFor(x => x.District)
            .MaximumLength(100).WithMessage("İlçe bilgisi en fazla 100 karakter olabilir.");

        RuleFor(x => x.PostalCode)
            .MaximumLength(20).WithMessage("Posta kodu en fazla 20 karakter olabilir.");
    }
}
