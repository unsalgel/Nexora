using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Moq;
using Nexora.Api;
using Nexora.Application.Abstractions;
using Nexora.Domain.Entities;
using Nexora.Persistence.Context;

namespace Nexora.UnitTests.Features;

public sealed class AdminSeederTests
{
    [Fact]
    public async Task Seed_WhenBootstrapEmailBelongsToCustomer_DoesNotElevateExistingAccount()
    {
        var databaseName = Guid.NewGuid().ToString("N");
        using var host = Host.CreateDefaultBuilder().UseEnvironment(Environments.Production)
            .ConfigureAppConfiguration(builder => builder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ADMIN_SEED_ENABLED"] = "true", ["ADMIN_SEED_EMAIL"] = "bootstrap@example.com",
                ["ADMIN_SEED_PASSWORD"] = "IsolatedTestOnly123*", ["DemoSeedEnabled"] = "false"
            }))
            .ConfigureServices(services =>
            {
                services.AddDbContext<NexoraDbContext>(options => options.UseInMemoryDatabase(databaseName));
                services.AddSingleton(Mock.Of<IPasswordHasher>());
            }).Build();
        Guid userId;
        Guid stamp;
        using (var scope = host.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<NexoraDbContext>();
            await context.Database.EnsureCreatedAsync();
            var user = new User { Id = Guid.NewGuid(), Email = "bootstrap@example.com", FirstName = "Test", LastName = "Kullanıcı", PasswordHash = "test" };
            context.Users.Add(user);
            await context.SaveChangesAsync();
            userId = user.Id;
            stamp = user.SecurityStamp;
        }
        var act = () => DatabaseSeeder.SeedAsync(host);
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*yönetici olmayan mevcut*");
        using var verifyScope = host.Services.CreateScope();
        var verify = verifyScope.ServiceProvider.GetRequiredService<NexoraDbContext>();
        (await verify.UserRoles.AnyAsync(x => x.UserId == userId)).Should().BeFalse();
        (await verify.Users.SingleAsync(x => x.Id == userId)).SecurityStamp.Should().Be(stamp);
    }

    [Fact]
    public async Task Seed_WhenProductionDemoFlagDisabled_DoesNotCreateCatalogOrVariants()
    {
        var databaseName = Guid.NewGuid().ToString("N");
        using var host = Host.CreateDefaultBuilder().UseEnvironment(Environments.Production)
            .ConfigureAppConfiguration(builder => builder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ADMIN_SEED_ENABLED"] = "false", ["ADMIN_SEED_PASSWORD"] = "", ["DemoSeedEnabled"] = "false"
            }))
            .ConfigureServices(services =>
            {
                services.AddDbContext<NexoraDbContext>(options => options.UseInMemoryDatabase(databaseName));
                services.AddSingleton(Mock.Of<IPasswordHasher>());
            }).Build();
        await DatabaseSeeder.SeedAsync(host);
        await VariantSeeder.SeedVariantsAsync(host);
        using var scope = host.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<NexoraDbContext>();
        (await context.Categories.CountAsync()).Should().Be(0);
        (await context.Products.CountAsync()).Should().Be(0);
        (await context.ProductVariants.CountAsync()).Should().Be(0);
    }
}
