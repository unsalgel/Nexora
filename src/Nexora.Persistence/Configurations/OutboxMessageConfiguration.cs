using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Entities;

namespace Nexora.Persistence.Configurations;

public sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Kind).HasMaxLength(50).IsRequired();
        builder.Property(x => x.ProtectedPayload).IsRequired();
        builder.Property(x => x.LastError).HasMaxLength(200);
        builder.HasIndex(x => new { x.ProcessedAtUtc, x.AvailableAtUtc });
    }
}
