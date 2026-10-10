using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql;

namespace Nexora.UnitTests.Integration;

[Trait("Category", "Integration")]
public sealed class MigrationPostgresTests
{
    [PostgresFact]
    public async Task IdempotentHardeningScript_CanRunTwiceWithoutRemovingNewSessions()
    {
        await using var database = new PostgresTestDatabase();
        await database.InitializeAsync();
        await using var context = database.CreateContext();
        var migrator = context.GetService<IMigrator>();
        await migrator.MigrateAsync("20261009100936_AddCouponsAndLogs");
        var script = migrator.GenerateScript("20261009100936_AddCouponsAndLogs", "20261010193605_HardenSessionsAndCommerce", MigrationsSqlGenerationOptions.Idempotent);
        await context.Database.ExecuteSqlRawAsync(script);
        await context.Database.ExecuteSqlRawAsync("""
            INSERT INTO "Users" ("Id", "FirstName", "LastName", "Email", "PasswordHash", "IsActive", "IsEmailConfirmed", "CreatedAtUtc", "SecurityStamp")
            VALUES ('11111111-1111-1111-1111-111111111111', 'Test', 'Kullanıcı', 'migration@example.test', 'test', true, true, NOW(), gen_random_uuid());
            INSERT INTO "RefreshTokens" ("Id", "UserId", "Token", "ExpiresAtUtc", "IsRevoked", "CreatedAtUtc", "SessionId")
            VALUES (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'new-digest', NOW() + INTERVAL '7 days', false, NOW(), gen_random_uuid());
            """);
        await context.Database.ExecuteSqlRawAsync(script);
        (await context.RefreshTokens.CountAsync()).Should().Be(1);
        (await context.Database.GetAppliedMigrationsAsync()).Should().Contain("20261010193605_HardenSessionsAndCommerce");
    }

    [PostgresFact]
    public async Task DuplicateLegacyCartRows_StopMigrationWithoutDeletingBusinessOrSessionData()
    {
        await using var database = new PostgresTestDatabase();
        await database.InitializeAsync();
        await using var context = database.CreateContext();
        var migrator = context.GetService<IMigrator>();
        await migrator.MigrateAsync("20261009100936_AddCouponsAndLogs");
        // Eski şemaya yeni entity modeliyle yazılmaz; fixture yalnız önceki sürümün zorunlu alanlarını kullanır.
        await context.Database.ExecuteSqlRawAsync("""
            INSERT INTO "Users" ("Id", "FirstName", "LastName", "Email", "PasswordHash", "IsActive", "IsEmailConfirmed", "CreatedAtUtc")
            VALUES ('11111111-1111-1111-1111-111111111111', 'Test', 'Kullanıcı', 'legacy@example.test', 'test', true, true, NOW());
            INSERT INTO "Categories" ("Id", "Name", "IsActive", "IsDeleted", "CreatedAtUtc")
            VALUES ('22222222-2222-2222-2222-222222222222', 'Test', true, false, NOW());
            INSERT INTO "Brands" ("Id", "Name", "IsActive", "IsDeleted", "CreatedAtUtc")
            VALUES ('33333333-3333-3333-3333-333333333333', 'Test', true, false, NOW());
            INSERT INTO "Products" ("Id", "Name", "SKU", "Price", "StockQuantity", "CategoryId", "BrandId", "IsActive", "IsDeleted", "CreatedAtUtc")
            VALUES ('44444444-4444-4444-4444-444444444444', 'Test', 'TEST', 100, 5, '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', true, false, NOW());
            INSERT INTO "Carts" ("Id", "UserId", "CreatedAtUtc")
            VALUES ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', NOW());
            INSERT INTO "CartItems" ("Id", "CartId", "ProductId", "Quantity", "CreatedAtUtc")
            VALUES (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 3, NOW()),
                   (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 3, NOW());
            INSERT INTO "RefreshTokens" ("Id", "UserId", "Token", "ExpiresAtUtc", "IsRevoked", "CreatedAtUtc")
            VALUES (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'legacy-test-token', NOW() + INTERVAL '7 days', false, NOW());
            """);
        var error = await Assert.ThrowsAsync<PostgresException>(() => migrator.MigrateAsync());
        error.SqlState.Should().Be("P0001");
        (await context.CartItems.CountAsync()).Should().Be(2);
        (await context.RefreshTokens.CountAsync()).Should().Be(1);
        (await context.Database.GetAppliedMigrationsAsync()).Should().NotContain("20261010193605_HardenSessionsAndCommerce");
    }
}
