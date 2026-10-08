using FluentValidation;

namespace Nexora.Application.Features.Reviews.Commands.CreateReview;

public sealed class CreateReviewCommandValidator : AbstractValidator<CreateReviewCommand>
{
    public CreateReviewCommandValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty()
            .WithMessage("Ürün seçilmelidir.");

        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5)
            .WithMessage("Puanlama değeri 1 ile 5 arasında olmalıdır.");

        RuleFor(x => x.Comment)
            .NotEmpty()
            .WithMessage("Yorum metni boş olamaz.")
            .MaximumLength(1000)
            .WithMessage("Yorum en fazla 1000 karakter olabilir.");
    }
}
