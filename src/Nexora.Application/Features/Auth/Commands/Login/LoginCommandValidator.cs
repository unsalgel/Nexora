using FluentValidation;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Auth.Commands.Login;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-posta adresi boş bırakılamaz.")
            .EmailAddress().WithMessage("Lütfen geçerli bir e-posta adresi giriniz.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Şifre alanı boş bırakılamaz.")
            .Must(PasswordPolicy.FitsBcrypt).WithMessage("Şifre UTF-8 olarak en fazla 72 byte olabilir. Uzun eski parolalar için şifre sıfırlamayı kullanın.");
    }
}
