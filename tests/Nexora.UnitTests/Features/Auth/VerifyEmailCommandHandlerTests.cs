using FluentAssertions;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Auth.Commands.VerifyEmail;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Auth;

public sealed class VerifyEmailCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context = TestDbContextFactory.Create();
    private readonly Mock<IEmailService> _email = new();
    private VerifyEmailCommandHandler Handler => new(_context, _email.Object, TestSecurity.Protector);
    public void Dispose() => TestDbContextFactory.Destroy(_context);
    private async Task<(User User, EmailVerificationCode Code)> Seed(int attempts = 0, bool expired = false)
    {
        var user = new User { Id = Guid.NewGuid(), Email = "user@example.test", FirstName = "Ali", LastName = "Veli", PasswordHash = "old" };
        var code = new EmailVerificationCode { UserId = user.Id, TargetEmail = user.Email, Code = TestSecurity.Protector.HashCode(user.Id, "verify:" + user.Email, "123456"), FailedAttempts = attempts, ExpiresAtUtc = DateTime.UtcNow.AddMinutes(expired ? -1 : 15) };
        _context.Users.Add(user); _context.EmailVerificationCodes.Add(code); await _context.SaveChangesAsync();
        return (user, code);
    }
    [Fact] public async Task UnknownAccount_IsRejected()
    {
        await FluentActions.Awaiting(() => Handler.Handle(new("unknown@example.test", "123456"), default)).Should().ThrowAsync<BusinessValidationException>();
    }
    [Fact] public async Task WrongCode_DurablyCountsAttempt()
    {
        var (user, code) = await Seed();
        await FluentActions.Awaiting(() => Handler.Handle(new(user.Email, "999999"), default)).Should().ThrowAsync<BusinessValidationException>();
        code.FailedAttempts.Should().Be(1); user.IsEmailConfirmed.Should().BeFalse();
    }
    [Fact] public async Task ExpiredCode_IsRejected()
    {
        var (user, _) = await Seed(expired: true);
        await FluentActions.Awaiting(() => Handler.Handle(new(user.Email, "123456"), default)).Should().ThrowAsync<BusinessValidationException>();
    }
    [Fact] public async Task FifthWrongAttempt_ConsumesCode()
    {
        var (user, code) = await Seed(attempts: 4);
        await FluentActions.Awaiting(() => Handler.Handle(new(user.Email, "999999"), default)).Should().ThrowAsync<BusinessValidationException>();
        code.IsUsed.Should().BeTrue(); code.FailedAttempts.Should().Be(5);
    }
    [Fact] public async Task ValidCode_ConfirmsEmailAndCannotBeReused()
    {
        var (user, code) = await Seed();
        (await Handler.Handle(new(user.Email, "123456"), default)).IsSuccess.Should().BeTrue();
        code.IsUsed.Should().BeTrue(); user.IsEmailConfirmed.Should().BeTrue();
        await FluentActions.Awaiting(() => Handler.Handle(new(user.Email, "123456"), default)).Should().ThrowAsync<BusinessValidationException>();
    }
}