using FluentAssertions;
using Nexora.Application.Features.Chat.Commands.SendMessage;

namespace Nexora.UnitTests.Features.Chat;

public sealed class SendChatMessageCommandValidatorTests
{
    private readonly SendChatMessageCommandValidator _validator;

    public SendChatMessageCommandValidatorTests()
    {
        _validator = new SendChatMessageCommandValidator();
    }

    [Fact]
    public void Validate_WhenMessageIsEmpty_ShouldHaveValidationError()
    {
        var command = new SendChatMessageCommand(string.Empty, null);

        var result = _validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Message" && e.ErrorMessage.Contains("boş olamaz"));
    }

    [Fact]
    public void Validate_WhenMessageExceedsMaxLength_ShouldHaveValidationError()
    {
        var longMessage = new string('a', 1001);
        var command = new SendChatMessageCommand(longMessage, null);

        var result = _validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Message" && e.ErrorMessage.Contains("en fazla 1000"));
    }

    [Fact]
    public void Validate_WhenMessageIsValid_ShouldPassValidation()
    {
        var command = new SendChatMessageCommand("Kablosuz kulaklık modelleriniz nelerdir?", null);

        var result = _validator.Validate(command);

        result.IsValid.Should().BeTrue();
    }
}
