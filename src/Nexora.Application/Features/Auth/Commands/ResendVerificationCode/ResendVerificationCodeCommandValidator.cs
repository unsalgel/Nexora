using FluentValidation;

namespace Nexora.Application.Features.Auth.Commands.ResendVerificationCode;

public sealed class ResendVerificationCodeCommandValidator : AbstractValidator<ResendVerificationCodeCommand>
{
    public ResendVerificationCodeCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-posta adresi boş bırakılamaz.")
            .EmailAddress().WithMessage("Geçerli bir e-posta adresi giriniz.");
    }
}
