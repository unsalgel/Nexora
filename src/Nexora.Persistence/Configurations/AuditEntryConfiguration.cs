using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Entities;

namespace Nexora.Persistence.Configurations;

public sealed class AuditEntryConfiguration : IEntityTypeConfiguration<AuditEntry>
{
    public void Configure(EntityTypeBuilder<AuditEntry> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TraceId).HasMaxLength(128);
        builder.Property(x => x.EntityType).HasMaxLength(100);
        builder.Property(x => x.EntityId).HasMaxLength(128);
        builder.Property(x => x.Action).HasMaxLength(20);
        builder.Property(x => x.Changes).HasColumnType("jsonb");
        builder.HasIndex(x => x.TimestampUtc);
        builder.HasIndex(x => new { x.EntityType, x.EntityId });
    }
}
