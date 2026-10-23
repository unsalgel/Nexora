using FluentValidation;

namespace Nexora.Application.Features.Payments.Commands.InitializePayment;

public sealed class InitializePaymentCommandValidator : AbstractValidator<InitializePaymentCommand>
{
    public InitializePaymentCommandValidator()
    {
        RuleFor(x => x.ShippingAddress)
            .NotEmpty().WithMessage("Teslimat adresi boş bırakılamaz.")
            .MaximumLength(500).WithMessage("Teslimat adresi en fazla 500 karakter olabilir.");
    }
}
