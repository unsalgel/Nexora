using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Nexora.Api.Hubs;
using Nexora.Api.Services;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Auth.Commands.Login;
using Nexora.Application.Features.Auth.Commands.RevokeToken;
using Nexora.Application.Features.Auth.Commands.ForgotPassword;
using Nexora.Application.Features.Users.Commands.UpdateUserRoles;
using Nexora.Domain.Entities;
using Nexora.Infrastructure.Authentication;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Auth;

public sealed class SessionSecurityRegressionTests : IDisposable
{
    private readonly NexoraDbContext _db = TestDbContextFactory.Create();
    public void Dispose() => TestDbContextFactory.Destroy(_db);
    private static ClaimsPrincipal Principal(User user, Guid sessionId, Guid? stamp = null, bool admin = false) => new(new ClaimsIdentity(new[]
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), new Claim("security_stamp", (stamp ?? user.SecurityStamp).ToString()),
        new Claim("sid", sessionId.ToString()), new Claim(ClaimTypes.Role, admin ? "Admin" : "Customer"),
        new Claim("exp", DateTimeOffset.UtcNow.AddMinutes(30).ToUnixTimeSeconds().ToString(System.Globalization.CultureInfo.InvariantCulture))
    }, "Bearer"));
    private async Task<(User User, RefreshToken Session)> Seed(bool admin = false)
    {
        var user = new User { Id = Guid.NewGuid(), Email = Guid.NewGuid() + "@example.test", FirstName = "Ali", LastName = "Veli", PasswordHash = "hash", IsEmailConfirmed = true };
        var role = await _db.Roles.SingleAsync(r => r.Name == (admin ? "Admin" : "Customer"));
        user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id, Role = role });
        var token = new RefreshToken { UserId = user.Id, Token = TestSecurity.Protector.HashRefreshToken("initial-" + user.Id), ExpiresAtUtc = DateTime.UtcNow.AddDays(7) };
        _db.Users.Add(user); _db.RefreshTokens.Add(token); await _db.SaveChangesAsync();
        return (user, token);
    }
    [Fact] public async Task DemotionThenLogin_DoesNotReviveOldAdminPrincipal()
    {
        var (user, session) = await Seed(admin: true); await Seed(admin: true);
        var originalStamp = user.SecurityStamp; var oldPrincipal = Principal(user, session.SessionId, admin: true);
        var validator = new AuthenticationSessionValidator(_db);
        (await validator.IsValidAsync(oldPrincipal, default)).Should().BeTrue();
        await new UpdateUserRolesCommandHandler(_db).Handle(new(user.Id, ["Customer"]), default);
        user.SecurityStamp.Should().NotBe(originalStamp);
        var hasher = new Mock<IPasswordHasher>(); hasher.Setup(x => x.Verify("Password123", "hash")).Returns(true);
        var login = new LoginCommandHandler(_db, hasher.Object, new JwtProvider(Options.Create(TestSecurity.Settings)), new Mock<ILoginAttemptService>().Object, TestSecurity.Protector);
        (await login.Handle(new(user.Email, "Password123"), default)).IsSuccess.Should().BeTrue();
        (await validator.IsValidAsync(oldPrincipal, default)).Should().BeFalse();
        var active = await _db.RefreshTokens.SingleAsync(t => t.UserId == user.Id && !t.IsRevoked);
        (await validator.IsValidAsync(Principal(user, active.SessionId), default)).Should().BeTrue();
    }
    [Fact] public async Task LogoutWithRefreshPossession_RevokesAccessSessionWithoutRedis()
    {
        var (user, session) = await Seed(); var principal = Principal(user, session.SessionId);
        await new RevokeTokenCommandHandler(_db, TestSecurity.Protector).Handle(new("initial-" + user.Id), default);
        (await new AuthenticationSessionValidator(_db).IsValidAsync(principal, default)).Should().BeFalse();
    }
    [Fact] public async Task MissingStampOrSession_IsRejected()
    {
        var (user, _) = await Seed();
        var legacy = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())], "Bearer"));
        (await new AuthenticationSessionValidator(_db).IsValidAsync(legacy, default)).Should().BeFalse();
        (await new AuthenticationSessionValidator(_db).IsValidAsync(Principal(user, Guid.NewGuid()), default)).Should().BeFalse();
    }
    [Fact] public async Task ExpiredOrUnauthenticatedPrincipal_IsRejectedBeforePrivatePublication()
    {
        var (user, session) = await Seed(); var principal = Principal(user, session.SessionId);
        var identity = (ClaimsIdentity)principal.Identity!;
        identity.RemoveClaim(identity.FindFirst("exp")!);
        identity.AddClaim(new Claim("exp", DateTimeOffset.UtcNow.AddSeconds(-1).ToUnixTimeSeconds().ToString(System.Globalization.CultureInfo.InvariantCulture)));
        var validator = new AuthenticationSessionValidator(_db);
        (await validator.IsValidAsync(principal, default)).Should().BeFalse();
        (await validator.IsValidAsync(new ClaimsPrincipal(new ClaimsIdentity(Principal(user, session.SessionId).Claims)), default)).Should().BeFalse();
    }
    [Fact] public async Task StaleAdminSocket_ReceivesNoPrivateEventAndIsAborted()
    {
        var (user, session) = await Seed(admin: true); var oldStamp = user.SecurityStamp; user.SecurityStamp = Guid.NewGuid(); await _db.SaveChangesAsync();
        var connection = new Mock<HubCallerContext>(); connection.SetupGet(c => c.ConnectionId).Returns("stale"); connection.SetupGet(c => c.User).Returns(Principal(user, session.SessionId, oldStamp, true));
        var registry = new HubConnectionRegistry(); registry.Add(connection.Object);
        var hub = new Mock<IHubContext<AppHub>>(); var clients = new Mock<IHubClients>(); hub.SetupGet(h => h.Clients).Returns(clients.Object);
        await new RealTimeNotificationService(hub.Object, registry, new AuthenticationSessionValidator(_db), new Mock<ILogger<RealTimeNotificationService>>().Object)
            .PublishToAdminsAsync("PrivateOrder", new { amount = 100 });
        clients.Verify(c => c.Client(It.IsAny<string>()), Times.Never); connection.Verify(c => c.Abort(), Times.Once);
    }
    [Fact] public void OtpDigest_IsBoundToUserAndPurpose()
    {
        var id = Guid.NewGuid(); var digest = TestSecurity.Protector.HashCode(id, "reset", "123456");
        TestSecurity.Protector.VerifyCode(id, "reset", "123456", digest).Should().BeTrue();
        TestSecurity.Protector.VerifyCode(Guid.NewGuid(), "reset", "123456", digest).Should().BeFalse();
        TestSecurity.Protector.VerifyCode(id, "verify", "123456", digest).Should().BeFalse();
    }
    [Fact] public async Task ForgotResponses_AreGenericAndRecipientCooldownPreservesCode()
    {
        var (user, _) = await Seed(); var email = new Mock<IEmailService>();
        var handler = new ForgotPasswordCommandHandler(_db, email.Object, TestSecurity.Protector);
        var first = await handler.Handle(new(user.Email), default);
        var second = await handler.Handle(new(user.Email), default);
        var unknown = await handler.Handle(new("unknown@example.test"), default);
        first.Data.Should().Be(second.Data).And.Be(unknown.Data);
        (await _db.PasswordResetCodes.CountAsync()).Should().Be(1);
        email.Verify(x => x.SendPasswordResetCodeEmailAsync(user.Email, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
