using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Auth.Commands.RefreshToken;
using Nexora.Application.Features.Auth.Commands.ResetPassword;
using Nexora.Application.Features.Users.Commands.UpdateUserRoles;
using Nexora.Application.Features.Users.Commands.UpdateUserStatus;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Integration;

[Trait("Category", "Integration")]
public sealed class SessionPostgresTests
{
    private static async Task<User> SeedUserAsync(Nexora.Persistence.Context.NexoraDbContext context, bool admin = false)
    {
        var role = await context.Roles.SingleAsync(r => r.Name == (admin ? "Admin" : "Customer"));
        var user = new User { Id = Guid.NewGuid(), Email = Guid.NewGuid() + "@example.test", FirstName = "Test", LastName = "Kullanıcı",
            PasswordHash = "hash", IsActive = true, IsEmailConfirmed = true };
        user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
        context.Users.Add(user); await context.SaveChangesAsync(); return user;
    }

    [PostgresFact]
    public async Task ConcurrentRefresh_OnlyOneRotationThenReplayRevokesFamily()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        await using var seed = database.CreateContext(); var user = await SeedUserAsync(seed);
        var originalStamp = user.SecurityStamp;
        seed.RefreshTokens.Add(new RefreshToken { UserId = user.Id, Token = TestSecurity.Protector.HashRefreshToken("original"), ExpiresAtUtc = DateTime.UtcNow.AddDays(7) });
        await seed.SaveChangesAsync();
        async Task<bool> Rotate()
        {
            await using var context = database.CreateContext(); var jwt = new Mock<IJwtProvider>();
            jwt.Setup(x => x.GenerateAccessToken(It.IsAny<User>(), It.IsAny<IList<string>>(), It.IsAny<Guid>())).Returns("access");
            jwt.Setup(x => x.GenerateRefreshToken()).Returns(() => Guid.NewGuid().ToString());
            jwt.Setup(x => x.GetRefreshTokenExpirationDays()).Returns(7);
            try { return (await new RefreshTokenCommandHandler(context, jwt.Object, TestSecurity.Protector).Handle(new("original"), default)).IsSuccess; }
            catch (UnauthorizedException) { return false; }
        }
        var results = await Task.WhenAll(Rotate(), Rotate());
        results.Count(x => x).Should().Be(1);
        await using var check = database.CreateContext();
        var tokens = await check.RefreshTokens.ToListAsync();
        tokens.Should().HaveCount(2).And.OnlyContain(t => t.IsRevoked);
        tokens.Select(t => t.SessionId).Distinct().Should().ContainSingle();
        (await check.Users.SingleAsync()).SecurityStamp.Should().NotBe(originalStamp);
    }

    [PostgresFact]
    public async Task ConcurrentDemotionAndFreeze_PreservesOneActiveAdmin()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        await using var seed = database.CreateContext(); var first = await SeedUserAsync(seed, true); var second = await SeedUserAsync(seed, true);
        async Task<bool> Demote()
        {
            await using var context = database.CreateContext();
            try { return (await new UpdateUserRolesCommandHandler(context).Handle(new(first.Id, ["Customer"]), default)).IsSuccess; }
            catch (ConflictException) { return false; }
        }
        async Task<bool> Freeze()
        {
            await using var context = database.CreateContext();
            try { return (await new UpdateUserStatusCommandHandler(context).Handle(new(second.Id, false), default)).IsSuccess; }
            catch (ConflictException) { return false; }
        }
        var results = await Task.WhenAll(Demote(), Freeze()); results.Count(x => x).Should().Be(1);
        await using var check = database.CreateContext();
        (await check.UserRoles.CountAsync(r => r.Role.Name == "Admin" && r.User.IsActive)).Should().Be(1);
    }

    [PostgresFact]
    public async Task ConcurrentWrongOtp_PersistsFiveAttemptLimitAcrossContexts()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        await using var seed = database.CreateContext(); var user = await SeedUserAsync(seed);
        seed.PasswordResetCodes.Add(new PasswordResetCode { UserId = user.Id, Code = TestSecurity.Protector.HashCode(user.Id, "reset", "123456"), ExpiresAtUtc = DateTime.UtcNow.AddMinutes(15) });
        await seed.SaveChangesAsync();
        async Task Wrong()
        {
            await using var context = database.CreateContext();
            await Assert.ThrowsAsync<BusinessValidationException>(() => new ResetPasswordCommandHandler(context, Mock.Of<IPasswordHasher>(), TestSecurity.Protector)
                .Handle(new(user.Email, "000000", "NewPassword123"), default));
        }
        await Task.WhenAll(Enumerable.Range(0, 6).Select(_ => Wrong()));
        await using var check = database.CreateContext(); var code = await check.PasswordResetCodes.SingleAsync();
        code.FailedAttempts.Should().Be(5); code.IsUsed.Should().BeTrue();
        await Assert.ThrowsAsync<BusinessValidationException>(() => new ResetPasswordCommandHandler(check, Mock.Of<IPasswordHasher>(), TestSecurity.Protector)
            .Handle(new(user.Email, "123456", "NewPassword123"), default));
        (await check.Users.SingleAsync()).PasswordHash.Should().Be("hash");
    }
}
