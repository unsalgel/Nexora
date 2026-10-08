using FluentValidation;

namespace Nexora.Application.Features.Chat.Commands.SendMessage;


public sealed class SendChatMessageCommandValidator : AbstractValidator<SendChatMessageCommand>
{
    public SendChatMessageCommandValidator()
    {
        RuleFor(x => x.Message)
            .NotEmpty()
            .WithMessage("Mesaj boş olamaz.")
            .MaximumLength(1000)
            .WithMessage("Mesaj en fazla 1000 karakter olabilir.");
    }
}
