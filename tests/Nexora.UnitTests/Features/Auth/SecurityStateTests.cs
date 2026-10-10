using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Nexora.Application.Features.Users.Commands.UpdateUserRoles;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Infrastructure.BackgroundJobs;
using Nexora.Infrastructure.Services;
using Nexora.UnitTests.Common;
using StackExchange.Redis;

namespace Nexora.UnitTests.Features.Auth;

public sealed class SecurityStateTests
{
    [Fact]
    public async Task RedisUnavailable_LoginAttemptCheckFailsClosed()
    {
        var database = new Mock<IDatabase>();
        database.Setup(x => x.HashGetAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), It.IsAny<CommandFlags>()))
            .ThrowsAsync(new RedisConnectionException(ConnectionFailureType.UnableToConnect, CommandFlags.None, "Unavailable test Redis"));
        var redis = new Mock<IConnectionMultiplexer>(); redis.Setup(x => x.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(database.Object);
        await Assert.ThrowsAsync<SecurityStateUnavailableException>(() => new LoginAttemptService(redis.Object).CheckAttemptAsync("user@example.test"));
    }

    [Theory]
    [InlineData("UnknownRole")]
    [InlineData("Customer", "Customer")]
    public async Task InvalidRoleSet_CannotEraseExistingRoles(params string[] requestedRoles)
    {
        using var context = TestDbContextFactory.Create();
        var role = await context.Roles.SingleAsync(r => r.Name == "Customer");
        var user = new User { Id = Guid.NewGuid(), Email = "roles@example.test", FirstName = "Test", LastName = "User", PasswordHash = "hash" };
        user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id }); context.Users.Add(user); await context.SaveChangesAsync();
        await Assert.ThrowsAsync<BusinessValidationException>(() => new UpdateUserRolesCommandHandler(context).Handle(new(user.Id, requestedRoles.ToList()), default));
        (await context.UserRoles.SingleAsync()).RoleId.Should().Be(role.Id);
    }

    [Fact]
    public async Task AuthCleanup_PreservesLiveOtpAndRecentRevokedSessions()
    {
        using var context = TestDbContextFactory.Create(); var user = new User { Id = Guid.NewGuid(), Email = "cleanup@example.test", FirstName = "Test", LastName = "User", PasswordHash = "hash" };
        context.Users.Add(user);
        context.PasswordResetCodes.AddRange(new PasswordResetCode { UserId = user.Id, Code = "old", ExpiresAtUtc = DateTime.UtcNow.AddDays(-2) },
            new PasswordResetCode { UserId = user.Id, Code = "live", ExpiresAtUtc = DateTime.UtcNow.AddMinutes(15) });
        context.EmailVerificationCodes.Add(new EmailVerificationCode { UserId = user.Id, Code = "old", ExpiresAtUtc = DateTime.UtcNow.AddDays(-2) });
        context.RefreshTokens.AddRange(new RefreshToken { UserId = user.Id, Token = "old", ExpiresAtUtc = DateTime.UtcNow.AddDays(-31) },
            new RefreshToken { UserId = user.Id, Token = "recent", ExpiresAtUtc = DateTime.UtcNow.AddDays(-1), IsRevoked = true },
            new RefreshToken { UserId = user.Id, Token = "live", ExpiresAtUtc = DateTime.UtcNow.AddDays(7) });
        await context.SaveChangesAsync(); await new AuthCleanupJob(context).RunAsync();
        (await context.PasswordResetCodes.SingleAsync()).Code.Should().Be("live");
        (await context.EmailVerificationCodes.CountAsync()).Should().Be(0);
        (await context.RefreshTokens.Select(t => t.Token).ToListAsync()).Should().BeEquivalentTo(["recent", "live"]);
    }
}
