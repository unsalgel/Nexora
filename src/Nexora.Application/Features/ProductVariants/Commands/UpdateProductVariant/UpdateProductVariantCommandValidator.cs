using FluentValidation;

namespace Nexora.Application.Features.ProductVariants.Commands.UpdateProductVariant;

public sealed class UpdateProductVariantCommandValidator : AbstractValidator<UpdateProductVariantCommand>
{
    public UpdateProductVariantCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Varyant kimliği boş bırakılamaz.");

        RuleFor(x => x.SKU)
            .NotEmpty().WithMessage("Varyant SKU kodu boş bırakılamaz.")
            .MaximumLength(50).WithMessage("Varyant SKU kodu en fazla 50 karakter olabilir.");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Varyant fiyatı 0'dan büyük olmalıdır.");

        RuleFor(x => x.StockQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Stok miktarı 0'dan küçük olamaz.");
    }
}
