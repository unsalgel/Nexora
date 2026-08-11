using FluentValidation;

namespace Nexora.Application.Features.Brands.Commands.UpdateBrand;

public sealed class UpdateBrandCommandValidator : AbstractValidator<UpdateBrandCommand>
{
    public UpdateBrandCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Marka kimliği boş bırakılamaz.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Marka adı boş bırakılamaz.")
            .MaximumLength(100).WithMessage("Marka adı en fazla 100 karakter olabilir.");

        RuleFor(x => x.LogoUrl)
            .MaximumLength(500).WithMessage("Logo bağlantısı en fazla 500 karakter olabilir.");
    }
}
