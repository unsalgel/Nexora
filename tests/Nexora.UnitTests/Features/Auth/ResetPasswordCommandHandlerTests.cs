using FluentAssertions;
using Microsoft.EntityFrameworkCore;
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
    private readonly NexoraDbContext _context;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<ICacheService> _cacheServiceMock;
    private readonly ResetPasswordCommandHandler _handler;

    public ResetPasswordCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _cacheServiceMock = new Mock<ICacheService>();

        _passwordHasherMock.Setup(h => h.Hash(It.IsAny<string>())).Returns("newHashedPassword123");

        _handler = new ResetPasswordCommandHandler(
            _context,
            _passwordHasherMock.Object,
            _cacheServiceMock.Object);
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task Handle_WhenUserNotFound_ThrowsBusinessValidationException()
    {
        var command = new ResetPasswordCommand("nonexistent@nexora.com", "123456", "NewSecret123!");

        var act = async () => await _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<BusinessValidationException>()
            .WithMessage("Geçersiz e-posta adresi veya sıfırlama kodu.");
    }

    [Fact]
    public async Task Handle_WhenNoActiveCode_ThrowsBusinessValidationException()
    {
        var user = new User { FirstName = "Ali", LastName = "Veli", Email = "ali@nexora.com", PasswordHash = "hash" };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var command = new ResetPasswordCommand(user.Email, "123456", "NewSecret123!");

        var act = async () => await _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<BusinessValidationException>()
            .WithMessage("Geçerli bir sıfırlama kodu bulunamadı. Lütfen tekrar kod talep edin.");
    }

    [Fact]
    public async Task Handle_WhenCodeExpired_ThrowsBusinessValidationException()
    {
        var user = new User { FirstName = "Ali", LastName = "Veli", Email = "ali@nexora.com", PasswordHash = "hash" };
        _context.Users.Add(user);

        var expiredCode = new PasswordResetCode
        {
            UserId = user.Id,
            Code = "123456",
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(-5),
            IsUsed = false
        };
        _context.PasswordResetCodes.Add(expiredCode);
        await _context.SaveChangesAsync();

        var command = new ResetPasswordCommand(user.Email, "123456", "NewSecret123!");

        var act = async () => await _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<BusinessValidationException>()
            .WithMessage("Sıfırlama kodunun geçerlilik süresi dolmuştur. Lütfen tekrar kod talep edin.");
    }

    [Fact]
    public async Task Handle_WhenAttemptsReachLimit_InvalidatesCodeAndThrowsException()
    {
        var user = new User { FirstName = "Ali", LastName = "Veli", Email = "ali@nexora.com", PasswordHash = "hash" };
        _context.Users.Add(user);

        var resetCode = new PasswordResetCode
        {
            UserId = user.Id,
            Code = "654321",
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(15),
            IsUsed = false
        };
        _context.PasswordResetCodes.Add(resetCode);
        await _context.SaveChangesAsync();

        _cacheServiceMock
            .Setup(c => c.GetAsync<int>(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(4);

        var command = new ResetPasswordCommand(user.Email, "999999", "NewSecret123!");

        var act = async () => await _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<BusinessValidationException>()
            .WithMessage("Çok fazla hatalı deneme yapıldığı için sıfırlama kodu iptal edildi. Lütfen tekrar kod talep ediniz.");

        resetCode.IsUsed.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenValidCode_ResetsPasswordAndRevokesTokens()
    {
        var user = new User { FirstName = "Ali", LastName = "Veli", Email = "ali@nexora.com", PasswordHash = "oldHash" };
        _context.Users.Add(user);

        var resetCode = new PasswordResetCode
        {
            UserId = user.Id,
            Code = "123456",
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(15),
            IsUsed = false
        };
        _context.PasswordResetCodes.Add(resetCode);

        var token = new RefreshToken
        {
            UserId = user.Id,
            Token = "existingToken123",
            ExpiresAtUtc = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        };
        _context.RefreshTokens.Add(token);
        await _context.SaveChangesAsync();

        var command = new ResetPasswordCommand(user.Email, "123456", "NewSecret123!");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        user.PasswordHash.Should().Be("newHashedPassword123");
        resetCode.IsUsed.Should().BeTrue();
        token.IsRevoked.Should().BeTrue();
    }
}
