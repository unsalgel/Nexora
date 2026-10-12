using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Auth.Commands.Register;
using Nexora.Domain.Exceptions;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Integration;

[Trait("Category", "Integration")]
public sealed class ReviewConcurrencyTests
{
    [PostgresFact]
    public async Task RolledBackMutation_DoesNotLeaveAnAuditEntry()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        await using (var db = database.CreateContext())
        {
            await using var transaction = await db.BeginTransactionAsync("audit-rollback");
            db.Users.Add(new Nexora.Domain.Entities.User { Email = "rollback@example.test", FirstName = "Test", LastName = "User", PasswordHash = "hash" });
            await db.SaveChangesAsync();
            (await db.AuditEntries.CountAsync()).Should().Be(1);
        }
        await using var check = database.CreateContext();
        (await check.Users.CountAsync()).Should().Be(0);
        (await check.AuditEntries.CountAsync()).Should().Be(0);
    }

    private static RegisterCommandHandler Handler(Nexora.Persistence.Context.NexoraDbContext context) =>
        new(context, Mock.Of<IPasswordHasher>(h => h.Hash(It.IsAny<string>()) == "hash"), Mock.Of<IEmailService>(), TestSecurity.Protector);

    [PostgresFact]
    public async Task ParallelRegistrations_ForSameEmail_ProduceExactlyOneUser()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        async Task<bool> Register()
        {
            await using var db = database.CreateContext();
            try { return (await Handler(db).Handle(new("Ali", "Veli", "same@example.test", "Password123"), default)).IsSuccess; }
            catch (ConflictException) { return false; }
        }
        var results = await Task.WhenAll(Register(), Register());
        results.Count(x => x).Should().Be(1);
        await using var check = database.CreateContext();
        (await check.Users.CountAsync()).Should().Be(1);
    }

    [PostgresFact]
    public async Task LockedEmail_DoesNotBlockAnUnrelatedRegistration()
    {
        await using var database = new PostgresTestDatabase(); await database.InitializeAsync();
        await using var locked = database.CreateContext();
        await using var transaction = await locked.BeginTransactionAsync("auth-email:locked@example.test");
        await using var unrelated = database.CreateContext();
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        (await Handler(unrelated).Handle(new("Ali", "Veli", "free@example.test", "Password123"), timeout.Token)).IsSuccess.Should().BeTrue();
    }
}
