using FluentValidation;

namespace Nexora.Application.Features.Cart.Commands.UpdateCartItemQuantity;

public sealed class UpdateCartItemQuantityCommandValidator : AbstractValidator<UpdateCartItemQuantityCommand>
{
    public UpdateCartItemQuantityCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Kullanıcı kimliği boş bırakılamaz.");

        RuleFor(x => x.CartItemId)
            .NotEmpty().WithMessage("Sepet kalemi kimliği boş bırakılamaz.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Ürün adedi en az 1 olmalıdır.");
    }
}
