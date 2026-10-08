using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Auth.Commands.RefreshToken;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Auth;

public sealed class RefreshTokenCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;
    private readonly Mock<IJwtProvider> _jwtProviderMock;
    private readonly RefreshTokenCommandHandler _handler;

    public RefreshTokenCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
        _jwtProviderMock = new Mock<IJwtProvider>();
        _handler = new RefreshTokenCommandHandler(_context, _jwtProviderMock.Object);
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task Handle_WhenTokenNotFound_ThrowsUnauthorizedException()
    {
        var command = new RefreshTokenCommand("non-existent-token");

        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("Geçersiz refresh token.");
    }

    [Fact]
    public async Task Handle_WhenTokenExpired_ThrowsUnauthorizedException()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Test",
            LastName = "User",
            Email = "test@nexora.com",
            PasswordHash = "hash",
            IsActive = true
        };

        var expiredToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Token = "expired-token",
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(-5),
            IsRevoked = false
        };

        _context.Users.Add(user);
        _context.RefreshTokens.Add(expiredToken);
        await _context.SaveChangesAsync();

        var command = new RefreshTokenCommand("expired-token");

        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("Refresh token süresi dolmuştur. Lütfen tekrar giriş yapınız.");
    }

    [Fact]
    public async Task Handle_WhenTokenAlreadyRevoked_RevokesAllActiveTokensAndThrowsUnauthorizedException()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Test",
            LastName = "User",
            Email = "test@nexora.com",
            PasswordHash = "hash",
            IsActive = true
        };

        var stolenToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Token = "stolen-token",
            ExpiresAtUtc = DateTime.UtcNow.AddDays(1),
            IsRevoked = true
        };

        var activeToken1 = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Token = "active-token-1",
            ExpiresAtUtc = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        };

        var activeToken2 = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Token = "active-token-2",
            ExpiresAtUtc = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        };

        _context.Users.Add(user);
        _context.RefreshTokens.AddRange(stolenToken, activeToken1, activeToken2);
        await _context.SaveChangesAsync();

        var command = new RefreshTokenCommand("stolen-token");

        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*Şüpheli oturum etkinliği tespit edildi*");

        var allTokensInDb = await _context.RefreshTokens.Where(rt => rt.UserId == user.Id).ToListAsync();
        allTokensInDb.Should().OnlyContain(rt => rt.IsRevoked);
    }

    [Fact]
    public async Task Handle_WhenValidToken_RotatesTokenAndReturnsNewAuthToken()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Test",
            LastName = "User",
            Email = "test@nexora.com",
            PasswordHash = "hash",
            IsActive = true
        };

        var validToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Token = "valid-token",
            ExpiresAtUtc = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        };

        _context.Users.Add(user);
        _context.RefreshTokens.Add(validToken);
        await _context.SaveChangesAsync();

        _jwtProviderMock
            .Setup(j => j.GenerateAccessToken(It.IsAny<User>(), It.IsAny<List<string>>()))
            .Returns("new-access-token");

        _jwtProviderMock
            .Setup(j => j.GenerateRefreshToken())
            .Returns("new-refresh-token");

        var command = new RefreshTokenCommand("valid-token");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.AccessToken.Should().Be("new-access-token");
        result.Data.RefreshToken.Should().Be("new-refresh-token");

        var oldTokenInDb = await _context.RefreshTokens.FirstAsync(rt => rt.Token == "valid-token");
        oldTokenInDb.IsRevoked.Should().BeTrue();

        var newTokenInDb = await _context.RefreshTokens.FirstAsync(rt => rt.Token == "new-refresh-token");
        newTokenInDb.IsRevoked.Should().BeFalse();
        newTokenInDb.UserId.Should().Be(user.Id);
    }
}
