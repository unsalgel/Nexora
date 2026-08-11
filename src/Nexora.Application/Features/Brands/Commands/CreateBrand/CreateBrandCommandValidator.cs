using FluentValidation;

namespace Nexora.Application.Features.Brands.Commands.CreateBrand;

public sealed class CreateBrandCommandValidator : AbstractValidator<CreateBrandCommand>
{
    public CreateBrandCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Marka adı boş bırakılamaz.")
            .MaximumLength(100).WithMessage("Marka adı en fazla 100 karakter olabilir.");

        RuleFor(x => x.LogoUrl)
            .MaximumLength(500).WithMessage("Logo bağlantısı en fazla 500 karakter olabilir.");
    }
}
