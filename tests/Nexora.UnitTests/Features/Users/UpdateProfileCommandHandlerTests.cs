using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Auth.Commands.VerifyEmail;
using Nexora.Application.Features.Users.Commands.UpdateProfile;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Users;

public sealed class UpdateProfileCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context = TestDbContextFactory.Create();
    private readonly Mock<IPasswordHasher> _hasher = new();
    private readonly Mock<IEmailService> _email = new();
    private UpdateProfileCommandHandler Handler => new(_context, _hasher.Object, TestSecurity.Protector, _email.Object);
    public void Dispose() => TestDbContextFactory.Destroy(_context);
    private async Task<User> Seed()
    {
        var user = new User { Id = Guid.NewGuid(), Email = "old@example.test", FirstName = "Old", LastName = "Name", PasswordHash = "hash", IsEmailConfirmed = true };
        _context.Users.Add(user); await _context.SaveChangesAsync();
        _hasher.Setup(x => x.Verify("CurrentPassword123", "hash")).Returns(true);
        return user;
    }
    [Fact] public async Task MissingUser_IsNotFound()
    {
        await FluentActions.Awaiting(() => Handler.Handle(new(Guid.NewGuid(), "Ali", "Veli", "unknown@example.test"), default)).Should().ThrowAsync<NotFoundException>();
    }
    [Fact] public async Task NameOnlyUpdate_DoesNotRequirePassword()
    {
        var user = await Seed();
        var result = await Handler.Handle(new(user.Id, "Ali", "Veli", user.Email), default);
        result.Data!.FirstName.Should().Be("Ali"); result.Data.Email.Should().Be(user.Email);
        _hasher.Verify(x => x.Verify(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }
    [Theory]
    [InlineData(null)]
    [InlineData("incorrect")]
    public async Task EmailChange_RequiresCurrentPassword(string? currentPassword)
    {
        var user = await Seed();
        await FluentActions.Awaiting(() => Handler.Handle(new(user.Id, "Ali", "Veli", "new@example.test", currentPassword), default)).Should().ThrowAsync<BusinessValidationException>();
        user.Email.Should().Be("old@example.test"); user.PendingEmail.Should().BeNull();
    }
    [Fact] public async Task TakenEmail_IsRejected()
    {
        var user = await Seed();
        _context.Users.Add(new User { Id = Guid.NewGuid(), Email = "taken@example.test", FirstName = "Ali", LastName = "Veli", PasswordHash = "hash" }); await _context.SaveChangesAsync();
        await FluentActions.Awaiting(() => Handler.Handle(new(user.Id, "Ali", "Veli", "taken@example.test", "CurrentPassword123"), default)).Should().ThrowAsync<ConflictException>();
    }
    [Fact] public async Task PendingEmail_PreservesRecoveryAddressUntilVerifiedThenRevokesSessions()
    {
        var user = await Seed(); var stamp = user.SecurityStamp; string? deliveredCode = null;
        _email.Setup(x => x.SendEmailVerificationCodeEmailAsync("new@example.test", It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Callback<string, string, string, CancellationToken>((_, _, code, _) => deliveredCode = code).Returns(Task.CompletedTask);
        var session = new RefreshToken { UserId = user.Id, Token = "digest", ExpiresAtUtc = DateTime.UtcNow.AddDays(7) };
        _context.RefreshTokens.Add(session); await _context.SaveChangesAsync();
        var result = await Handler.Handle(new(user.Id, "Ali", "Veli", "new@example.test", "CurrentPassword123"), default);
        result.Data!.Email.Should().Be("old@example.test"); result.Data.PendingEmail.Should().Be("new@example.test"); user.IsEmailConfirmed.Should().BeTrue(); session.IsRevoked.Should().BeFalse();
        var verifier = new VerifyEmailCommandHandler(_context, _email.Object, TestSecurity.Protector);
        (await verifier.Handle(new("new@example.test", deliveredCode!), default)).IsSuccess.Should().BeTrue();
        user.Email.Should().Be("new@example.test"); user.PendingEmail.Should().BeNull(); user.SecurityStamp.Should().NotBe(stamp); session.IsRevoked.Should().BeTrue();
        (await _context.EmailVerificationCodes.SingleAsync()).Code.Should().NotBe(deliveredCode);
    }
    [Fact] public async Task NameOnlyUpdate_PreservesPendingEmailVerification()
    {
        var user = await Seed();
        await Handler.Handle(new(user.Id, "Ali", "Veli", "new@example.test", "CurrentPassword123"), default);
        await Handler.Handle(new(user.Id, "Updated", "Name", "old@example.test"), default);
        user.PendingEmail.Should().Be("new@example.test");
        (await _context.EmailVerificationCodes.SingleAsync()).IsUsed.Should().BeFalse();
    }
    [Fact] public async Task RapidPendingTargetSwitch_CannotReserveTargetWithConsumedCode()
    {
        var user = await Seed();
        await Handler.Handle(new(user.Id, "Ali", "Veli", "first@example.test", "CurrentPassword123"), default);
        await Handler.Handle(new(user.Id, "Ali", "Veli", "second@example.test", "CurrentPassword123"), default);
        await Assert.ThrowsAsync<TooManyRequestsException>(() => Handler.Handle(new(user.Id, "Ali", "Veli", "first@example.test", "CurrentPassword123"), default));
        user.PendingEmail.Should().Be("second@example.test");
        (await _context.EmailVerificationCodes.CountAsync(c => !c.IsUsed)).Should().Be(1);
        _email.Verify(x => x.SendEmailVerificationCodeEmailAsync("first@example.test", It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
