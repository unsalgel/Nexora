using FluentValidation;

namespace Nexora.Application.Features.Chat.Commands.SendMessage;

/// <summary>
/// Chatbot mesaj komutunun doğrulama kuralları.
/// MediatR ValidationBehavior pipeline'ında handler'a ulaşmadan otomatik çalışır.
/// </summary>
public sealed class SendChatMessageCommandValidator : AbstractValidator<SendChatMessageCommand>
{
    public SendChatMessageCommandValidator()
    {
        RuleFor(x => x.Message)
            .NotEmpty()
            .WithMessage("Mesaj boş olamaz.");
    }
}
