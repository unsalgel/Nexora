using FluentValidation;

namespace Nexora.Application.Features.Chat.Commands.SendMessage;


public sealed class SendChatMessageCommandValidator : AbstractValidator<SendChatMessageCommand>
{
    public SendChatMessageCommandValidator()
    {
        RuleFor(x => x.History).Must(h => h is null || h.Count <= 3).WithMessage("Konuşma geçmişi en fazla 3 mesaj içerebilir.");
        RuleForEach(x => x.History).ChildRules(item =>
        {
            item.RuleFor(x => x.Role).Must(role => role is "user" or "assistant").WithMessage("Geçersiz mesaj rolü.");
            item.RuleFor(x => x.Content).NotEmpty().MaximumLength(500);
        });
        RuleFor(x => x.Message)
            .NotEmpty()
            .WithMessage("Mesaj boş olamaz.")
            .MaximumLength(1000)
            .WithMessage("Mesaj en fazla 1000 karakter olabilir.");
    }
}
