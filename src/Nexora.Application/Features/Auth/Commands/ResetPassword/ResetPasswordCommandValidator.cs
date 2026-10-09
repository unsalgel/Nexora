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
            .MinimumLength(8).WithMessage("Yeni şifre en az 8 karakter olmalıdır.")
            .MaximumLength(72).WithMessage("Yeni şifre en fazla 72 karakter olabilir.")
            .Matches("[A-Z]").WithMessage("Yeni şifre en az 1 büyük harf içermelidir.")
            .Matches("[a-z]").WithMessage("Yeni şifre en az 1 küçük harf içermelidir.")
            .Matches("[0-9]").WithMessage("Yeni şifre en az 1 rakam içermelidir.");
    }
}
