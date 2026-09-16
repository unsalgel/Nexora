using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Features.Users.Commands.UpdateUserStatus;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Users;

public sealed class UpdateUserStatusCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;
    private readonly UpdateUserStatusCommandHandler _handler;

    public UpdateUserStatusCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
        _handler = new UpdateUserStatusCommandHandler(_context);
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
    }

    [Fact]
    public async Task Handle_WhenUserNotFound_ThrowsNotFoundException()
    {
        var command = new UpdateUserStatusCommand(Guid.NewGuid(), true);
        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }
}
