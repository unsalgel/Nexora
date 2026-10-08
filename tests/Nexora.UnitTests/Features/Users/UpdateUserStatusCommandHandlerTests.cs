using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Users.Commands.UpdateUserStatus;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Users;

public sealed class UpdateUserStatusCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;
    private readonly Mock<ITokenBlacklistService> _tokenBlacklistServiceMock;
    private readonly UpdateUserStatusCommandHandler _handler;

    public UpdateUserStatusCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
        _tokenBlacklistServiceMock = new Mock<ITokenBlacklistService>();
        _handler = new UpdateUserStatusCommandHandler(_context, _tokenBlacklistServiceMock.Object);
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task Handle_WhenUserDeactivated_RevokesAllRefreshTokens()
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
        _context.Users.Add(user);

        var token1 = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = "token-1",
            ExpiresAtUtc = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        };
        var token2 = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = "token-2",
            ExpiresAtUtc = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        };
        _context.RefreshTokens.AddRange(token1, token2);
        await _context.SaveChangesAsync();

        var command = new UpdateUserStatusCommand(user.Id, false);
        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        
        var updatedUser = await _context.Users.FindAsync(user.Id);
        updatedUser!.IsActive.Should().BeFalse();

        var tokens = await _context.RefreshTokens.Where(t => t.UserId == user.Id).ToListAsync();
        tokens.Should().OnlyContain(t => t.IsRevoked);

        _tokenBlacklistServiceMock.Verify(x => x.RevokeUserAsync(user.Id, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenUserActivated_UnrevokesUser()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Test",
            LastName = "User",
            Email = "active@nexora.com",
            PasswordHash = "hash",
            IsActive = false
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var command = new UpdateUserStatusCommand(user.Id, true);
        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        var updatedUser = await _context.Users.FindAsync(user.Id);
        updatedUser!.IsActive.Should().BeTrue();

        _tokenBlacklistServiceMock.Verify(x => x.UnrevokeUserAsync(user.Id, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenLastAdminDeactivated_ThrowsConflictException()
    {
        var adminRole = await _context.Roles.FirstAsync(r => r.Name == "Admin");

        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Admin",
            LastName = "User",
            Email = "admin@nexora.com",
            PasswordHash = "hash",
            IsActive = true
        };
        _context.Users.Add(adminUser);

        var userRole = new UserRole { UserId = adminUser.Id, RoleId = adminRole.Id, Role = adminRole, User = adminUser };
        _context.UserRoles.Add(userRole);
        await _context.SaveChangesAsync();

        var command = new UpdateUserStatusCommand(adminUser.Id, false);
        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("Sistemdeki son aktif yönetici dondurulamaz.");

        var unchangedAdmin = await _context.Users.FindAsync(adminUser.Id);
        unchangedAdmin!.IsActive.Should().BeTrue();
    }
}
