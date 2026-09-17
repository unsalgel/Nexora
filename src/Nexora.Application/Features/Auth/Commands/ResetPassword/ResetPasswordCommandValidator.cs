using FluentValidation;

namespace Nexora.Application.Features.Auth.Commands.ResetPassword;

public sealed class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-posta adresi boş bırakılamaz.")
            .EmailAddress().WithMessage("Geçerli bir e-posta adresi giriniz.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Sıfırlama kodu boş bırakılamaz.")
            .Length(6).WithMessage("Sıfırlama kodu 6 haneli olmalıdır.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Yeni şifre boş bırakılamaz.")
            .MinimumLength(6).WithMessage("Yeni şifre en az 6 karakter olmalıdır.");
    }
}
