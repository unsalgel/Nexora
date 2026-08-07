using FluentValidation;

namespace Nexora.Application.Features.Categories.Commands.UpdateCategory;

public sealed class UpdateCategoryCommandValidator : AbstractValidator<UpdateCategoryCommand>
{
    public UpdateCategoryCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Kategori kimliği boş bırakılamaz.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Kategori adı boş bırakılamaz.")
            .MaximumLength(100).WithMessage("Kategori adı en fazla 100 karakter olabilir.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Kategori açıklaması en fazla 500 karakter olabilir.");
    }
}
