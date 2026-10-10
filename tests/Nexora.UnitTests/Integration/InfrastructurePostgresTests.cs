using FluentAssertions;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Nexora.Application.Features.Categories.Commands.UpdateCategory;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Infrastructure.Services;
using Nexora.Infrastructure.BackgroundJobs;

namespace Nexora.UnitTests.Integration;

[Trait("Category", "Integration")]
public sealed class InfrastructurePostgresTests
{
    [PostgresFact]
    public async Task EmailOutboxAndBusinessWrite_RollBackTogether_WhenTransactionDoesNotCommit()
    {
        await using var database = new PostgresTestDatabase();
        await database.InitializeAsync();
        var protection = new EphemeralDataProtectionProvider();
        await using (var context = database.CreateContext())
        await using (var transaction = await context.BeginTransactionAsync("outbox-rollback-test"))
        {
            context.Users.Add(new User { Id = Guid.NewGuid(), Email = "atomic@example.com", FirstName = "Test", LastName = "Kullanıcı", PasswordHash = "test" });
            await new HangfireEmailService(context, protection).SendWelcomeEmailAsync("atomic@example.com", "Test");
            await context.SaveChangesAsync();
            // Dispose commit edilmemiş gerçek PostgreSQL transaction'ını geri alır.
        }
        await using var verify = database.CreateContext();
        (await verify.Users.AnyAsync(x => x.Email == "atomic@example.com")).Should().BeFalse();
        (await verify.OutboxMessages.CountAsync()).Should().Be(0);
    }

    [PostgresFact]
    public async Task ConcurrentCategoryReparenting_CannotCreateTwoNodeCycle()
    {
        await using var database = new PostgresTestDatabase();
        await database.InitializeAsync();
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();
        await using (var setup = database.CreateContext())
        {
            setup.Categories.AddRange(new Category { Id = a, Name = "A" }, new Category { Id = b, Name = "B" });
            await setup.SaveChangesAsync();
        }
        async Task<bool> Reparent(Guid id, string name, Guid parent)
        {
            await using var context = database.CreateContext();
            try
            {
                await new UpdateCategoryCommandHandler(context).Handle(new(id, name, null, parent, true), CancellationToken.None);
                return true;
            }
            catch (ConflictException) { return false; }
        }
        var results = await Task.WhenAll(Reparent(a, "A", b), Reparent(b, "B", a));
        results.Count(x => x).Should().Be(1);
        await using var verify = database.CreateContext();
        var categories = await verify.Categories.Where(x => x.Id == a || x.Id == b).ToListAsync();
        categories.Count(x => x.ParentCategoryId.HasValue).Should().Be(1);
    }

    [PostgresFact]
    public async Task OrphanCleanup_PreservesAbsoluteBrandLogoReference_WithRealSqlTranslation()
    {
        await using var database = new PostgresTestDatabase();
        await database.InitializeAsync();
        var root = Path.Combine(Path.GetTempPath(), "nexora-orphan-pg-test-" + Guid.NewGuid().ToString("N"));
        try
        {
            var folder = Path.Combine(root, "uploads", "products");
            Directory.CreateDirectory(folder);
            var referencedName = Guid.NewGuid().ToString("N") + ".png";
            var orphanName = Guid.NewGuid().ToString("N") + ".png";
            foreach (var name in new[] { referencedName, orphanName })
            {
                var path = Path.Combine(folder, name);
                await File.WriteAllTextAsync(path, "test-fixture");
                File.SetLastWriteTimeUtc(path, DateTime.UtcNow.AddDays(-2));
            }
            await using var context = database.CreateContext();
            context.Brands.Add(new Brand { Id = Guid.NewGuid(), Name = "Absolute logo", IsDeleted = true,
                LogoUrl = "https://cdn.example.test/uploads/products/" + referencedName + "?cache=1" });
            await context.SaveChangesAsync();
            var environment = new Mock<IWebHostEnvironment>();
            environment.SetupGet(x => x.WebRootPath).Returns(root);
            environment.SetupGet(x => x.ContentRootPath).Returns(root);
            await new FileCleanupJob(context, environment.Object, new LocalFileStorageService(environment.Object), NullLogger<FileCleanupJob>.Instance).RunAsync();
            File.Exists(Path.Combine(folder, referencedName)).Should().BeTrue();
            File.Exists(Path.Combine(folder, orphanName)).Should().BeFalse();
        }
        finally
        {
            if (Directory.Exists(root) && Path.GetFileName(root).StartsWith("nexora-orphan-pg-test-", StringComparison.Ordinal))
                Directory.Delete(root, true);
        }
    }
}
