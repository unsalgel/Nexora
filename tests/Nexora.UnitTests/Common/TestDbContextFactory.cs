using Microsoft.EntityFrameworkCore;
using Nexora.Persistence.Context;

namespace Nexora.UnitTests.Common;

public static class TestDbContextFactory
{
    public static NexoraDbContext Create()
    {
        var options = new DbContextOptionsBuilder<NexoraDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new NexoraDbContext(options);
        context.Database.EnsureCreated();

        return context;
    }

    public static void Destroy(NexoraDbContext context)
    {
        context.Database.EnsureDeleted();
        context.Dispose();
    }
}
