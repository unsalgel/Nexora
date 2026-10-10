using FluentAssertions;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Auth.Commands.ResetPassword;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Auth;

public sealed class ResetPasswordCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context = TestDbContextFactory.Create();
    private readonly Mock<IPasswordHasher> _hasher = new();
    private ResetPasswordCommandHandler Handler => new(_context, _hasher.Object, TestSecurity.Protector);
    public void Dispose() => TestDbContextFactory.Destroy(_context);
    private async Task<(User User, PasswordResetCode Code)> Seed(int attempts = 0, bool expired = false)
    {
        var user = new User { Id = Guid.NewGuid(), Email = "user@example.test", FirstName = "Ali", LastName = "Veli", PasswordHash = "old", IsEmailConfirmed = true };
        var code = new PasswordResetCode { UserId = user.Id, Code = TestSecurity.Protector.HashCode(user.Id, "reset", "123456"), FailedAttempts = attempts, ExpiresAtUtc = DateTime.UtcNow.AddMinutes(expired ? -1 : 15) };
        _context.Users.Add(user);
        _context.PasswordResetCodes.Add(code);
        await _context.SaveChangesAsync();
        return (user, code);
    }
    [Fact] public async Task UnknownAccount_IsRejected()
    {
        await FluentActions.Awaiting(() => Handler.Handle(new("unknown@example.test", "123456", "Password123"), default)).Should().ThrowAsync<BusinessValidationException>();
    }
    [Fact] public async Task MissingCode_IsRejected()
    {
        var user = new User { Id = Guid.NewGuid(), Email = "user@example.test", FirstName = "Ali", LastName = "Veli", PasswordHash = "old" };
        _context.Users.Add(user); await _context.SaveChangesAsync();
        await FluentActions.Awaiting(() => Handler.Handle(new(user.Email, "123456", "Password123"), default)).Should().ThrowAsync<BusinessValidationException>();
    }
    [Fact] public async Task ExpiredCode_IsRejected()
    {
        var (user, _) = await Seed(expired: true);
        await FluentActions.Awaiting(() => Handler.Handle(new(user.Email, "123456", "Password123"), default)).Should().ThrowAsync<BusinessValidationException>();
    }
    [Fact] public async Task FifthWrongAttempt_DurablyConsumesCodeWithoutRedis()
    {
        var (user, code) = await Seed(attempts: 4);
        await FluentActions.Awaiting(() => Handler.Handle(new(user.Email, "999999", "Password123"), default)).Should().ThrowAsync<BusinessValidationException>();
        code.IsUsed.Should().BeTrue(); code.FailedAttempts.Should().Be(5);
        await FluentActions.Awaiting(() => Handler.Handle(new(user.Email, "123456", "Password123"), default)).Should().ThrowAsync<BusinessValidationException>();
    }
    [Fact] public async Task ValidCode_ChangesStampRevokesSessionsAndCannotBeReused()
    {
        var (user, code) = await Seed(); var originalStamp = user.SecurityStamp;
        var token = new RefreshToken { UserId = user.Id, Token = "digest", ExpiresAtUtc = DateTime.UtcNow.AddDays(7) };
        _context.RefreshTokens.Add(token); await _context.SaveChangesAsync();
        _hasher.Setup(x => x.Hash("Password123")).Returns("new-hash");
        (await Handler.Handle(new(user.Email, "123456", "Password123"), default)).IsSuccess.Should().BeTrue();
        user.PasswordHash.Should().Be("new-hash"); user.SecurityStamp.Should().NotBe(originalStamp);
        code.IsUsed.Should().BeTrue(); token.IsRevoked.Should().BeTrue(); code.Code.Should().NotBe("123456");
        await FluentActions.Awaiting(() => Handler.Handle(new(user.Email, "123456", "OtherPassword123"), default)).Should().ThrowAsync<BusinessValidationException>();
    }
}