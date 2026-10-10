using Microsoft.EntityFrameworkCore;
using Nexora.Persistence.Context;
using Npgsql;

namespace Nexora.UnitTests.Integration;

public sealed class PostgresFactAttribute : FactAttribute
{
    public PostgresFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("NEXORA_TEST_POSTGRES")))
            Skip = "İzole PostgreSQL test sunucusu için NEXORA_TEST_POSTGRES tanımlanmalıdır.";
    }
}

public sealed class PostgresTestDatabase : IAsyncLifetime, IAsyncDisposable
{
    private readonly string _databaseName = "nexora_review_test_" + Guid.NewGuid().ToString("N");
    private readonly string _adminConnection;
    private bool _created;
    public DbContextOptions<NexoraDbContext> Options { get; }

    public PostgresTestDatabase()
    {
        _adminConnection = Environment.GetEnvironmentVariable("NEXORA_TEST_POSTGRES")
            ?? throw new InvalidOperationException("NEXORA_TEST_POSTGRES eksik.");
        var builder = new NpgsqlConnectionStringBuilder(_adminConnection) { Database = _databaseName, Pooling = false };
        Options = new DbContextOptionsBuilder<NexoraDbContext>().UseNpgsql(builder.ConnectionString).Options;
    }

    public NexoraDbContext CreateContext() => new(Options);

    public async Task InitializeAsync()
    {
        await using var connection = new NpgsqlConnection(_adminConnection);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand($"CREATE DATABASE \"{_databaseName}\"", connection);
        await command.ExecuteNonQueryAsync();
        _created = true;
        await using var context = CreateContext();
        await context.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        if (!_created) return;
        // Ortam değişkenindeki veritabanı değil, yalnız bu fixture'ın ürettiği veritabanı silinir.
        if (!_databaseName.StartsWith("nexora_review_test_", StringComparison.Ordinal) || _databaseName.Length != 51)
            throw new InvalidOperationException("Test veritabanı adı doğrulanamadı.");
        await using var connection = new NpgsqlConnection(_adminConnection);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand($"DROP DATABASE \"{_databaseName}\" WITH (FORCE)", connection);
        await command.ExecuteNonQueryAsync();
        _created = false;
    }

    ValueTask IAsyncDisposable.DisposeAsync() => new(DisposeAsync());
}
