using FluentValidation;

namespace Nexora.Application.Features.Cart.Commands.AddItemToCart;

public sealed class AddItemToCartCommandValidator : AbstractValidator<AddItemToCartCommand>
{
    public AddItemToCartCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Kullanıcı kimliği boş bırakılamaz.");

        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Ürün seçimi zorunludur.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Eklenen ürün adedi 0'dan büyük olmalıdır.");
    }
}
