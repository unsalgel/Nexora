using FluentValidation;

namespace Nexora.Application.Features.Chat.Commands.SendMessage;


public sealed class SendChatMessageCommandValidator : AbstractValidator<SendChatMessageCommand>
{
    public SendChatMessageCommandValidator()
    {
        RuleFor(x => x.Message)
            .NotEmpty()
            .WithMessage("Mesaj boş olamaz.");
    }
}
