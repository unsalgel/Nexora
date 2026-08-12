using FluentValidation;

namespace Nexora.Application.Features.Favorites.Commands.AddFavorite;

public sealed class AddFavoriteCommandValidator : AbstractValidator<AddFavoriteCommand>
{
    public AddFavoriteCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Kullanıcı kimliği boş bırakılamaz.");

        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Ürün seçimi zorunludur.");
    }
}
