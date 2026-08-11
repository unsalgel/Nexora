using FluentValidation;

namespace Nexora.Application.Features.Products.Commands.AddProductImage;

public sealed class AddProductImageCommandValidator : AbstractValidator<AddProductImageCommand>
{
    public AddProductImageCommandValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Ürün kimliği boş bırakılamaz.");

        RuleFor(x => x.ImageUrl)
            .NotEmpty().WithMessage("Görsel URL'si boş bırakılamaz.")
            .MaximumLength(500).WithMessage("Görsel URL'si en fazla 500 karakter olabilir.");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Görsel sıralaması 0'dan küçük olamaz.");
    }
}
