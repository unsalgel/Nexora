using FluentValidation.TestHelper;
using Nexora.Application.Features.Users.Commands.UpdateProfile;

namespace Nexora.UnitTests.Features.Users;

public sealed class UpdateProfileCommandValidatorTests
{
    private readonly UpdateProfileCommandValidator _validator;

    public UpdateProfileCommandValidatorTests()
    {
        _validator = new UpdateProfileCommandValidator();
    }

    [Fact]
    public void Validate_WhenCommandIsValid_ShouldNotHaveAnyErrors()
    {
        var command = new UpdateProfileCommand(
            Guid.NewGuid(),
            "Ünsal",
            "Gel",
            "unsal@nexora.com");

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("A")]
    public void Validate_WhenFirstNameInvalid_ShouldHaveValidationError(string firstName)
    {
        var command = new UpdateProfileCommand(
            Guid.NewGuid(),
            firstName,
            "Gel",
            "unsal@nexora.com");

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.FirstName);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("A")]
    public void Validate_WhenLastNameInvalid_ShouldHaveValidationError(string lastName)
    {
        var command = new UpdateProfileCommand(
            Guid.NewGuid(),
            "Ünsal",
            lastName,
            "unsal@nexora.com");

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.LastName);
    }

    [Theory]
    [InlineData("")]
    [InlineData("gecersiz-eposta")]
    [InlineData("gecersiz@")]
    public void Validate_WhenEmailInvalid_ShouldHaveValidationError(string email)
    {
        var command = new UpdateProfileCommand(
            Guid.NewGuid(),
            "Ünsal",
            "Gel",
            email);

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Email);
    }
}
