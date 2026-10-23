using FluentValidation;

namespace Nexora.Application.Features.Payments.Commands.InitializePayment;

public sealed class InitializePaymentCommandValidator : AbstractValidator<InitializePaymentCommand>
{
    public InitializePaymentCommandValidator()
    {
        RuleFor(x => x.IdempotencyKey).NotEmpty().MaximumLength(128);
        RuleFor(x => x.BillingAddress).MaximumLength(500);
        RuleFor(x => x.CouponCode).MaximumLength(50);
        RuleFor(x => x.ExpectedTotalAmount).GreaterThan(0).When(x => x.ExpectedTotalAmount.HasValue);
        RuleFor(x => x.ShippingAddress)
            .NotEmpty().WithMessage("Teslimat adresi boş bırakılamaz.")
            .MaximumLength(500).WithMessage("Teslimat adresi en fazla 500 karakter olabilir.");
    }
}
