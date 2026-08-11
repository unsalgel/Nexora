using FluentValidation;

namespace Nexora.Application.Features.Products.Commands.UpdateProduct;

public sealed class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Ürün kimliği boş bırakılamaz.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Ürün adı boş bırakılamaz.")
            .MaximumLength(200).WithMessage("Ürün adı en fazla 200 karakter olabilir.");

        RuleFor(x => x.SKU)
            .NotEmpty().WithMessage("SKU kodu boş bırakılamaz.")
            .MaximumLength(50).WithMessage("SKU kodu en fazla 50 karakter olabilir.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Ürün açıklaması en fazla 2000 karakter olabilir.");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Ürün fiyatı 0'dan büyük olmalıdır.");

        RuleFor(x => x.StockQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Stok miktarı 0'dan küçük olamaz.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Kategori seçimi zorunludur.");

        RuleFor(x => x.BrandId)
            .NotEmpty().WithMessage("Marka seçimi zorunludur.");
    }
}
