using FluentValidation;

namespace Nexora.Application.Features.ProductVariants.Commands.CreateProductVariant;

public sealed class CreateProductVariantCommandValidator : AbstractValidator<CreateProductVariantCommand>
{
    public CreateProductVariantCommandValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Ürün seçimi zorunludur.");

        RuleFor(x => x.SKU)
            .NotEmpty().WithMessage("Varyant SKU kodu boş bırakılamaz.")
            .MaximumLength(50).WithMessage("Varyant SKU kodu en fazla 50 karakter olabilir.");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Varyant fiyatı 0'dan büyük olmalıdır.");

        RuleFor(x => x.StockQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Stok miktarı 0'dan küçük olamaz.");

        RuleFor(x => x.AttributeValueIds)
            .NotEmpty().WithMessage("En az bir özellik değeri seçilmelidir.");
    }
}
