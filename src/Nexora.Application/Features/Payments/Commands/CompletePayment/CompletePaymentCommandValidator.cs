using FluentValidation;

namespace Nexora.Application.Features.Payments.Commands.CompletePayment;

public sealed class CompletePaymentCommandValidator : AbstractValidator<CompletePaymentCommand>
{
    public CompletePaymentCommandValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Ödeme belirteci (token) boş bırakılamaz.").MaximumLength(128);
    }
}
