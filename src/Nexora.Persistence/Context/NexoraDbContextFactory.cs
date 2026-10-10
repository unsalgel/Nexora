using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Nexora.Persistence.Context;

public sealed class NexoraDbContextFactory : IDesignTimeDbContextFactory<NexoraDbContext>
{
    public NexoraDbContext CreateDbContext(string[] args)
    {
        var connection = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? throw new InvalidOperationException("Migration için ConnectionStrings__DefaultConnection ortam değişkenini tanımlayınız.");
        var options = new DbContextOptionsBuilder<NexoraDbContext>().UseNpgsql(connection).Options;
        return new NexoraDbContext(options);
    }
}
