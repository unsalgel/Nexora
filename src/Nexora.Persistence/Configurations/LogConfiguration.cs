using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Entities;

namespace Nexora.Persistence.Configurations;

public sealed class LogConfiguration : IEntityTypeConfiguration<Log>
{
    public void Configure(EntityTypeBuilder<Log> builder)
    {
        builder.ToTable("logs");

        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).HasColumnName("id");
        builder.Property(l => l.Message).HasColumnName("message");
        builder.Property(l => l.MessageTemplate).HasColumnName("message_template");
        builder.Property(l => l.Level).HasColumnName("level").HasMaxLength(50);
        builder.Property(l => l.TimestampUtc).HasColumnName("timestamp_utc");
        builder.Property(l => l.Exception).HasColumnName("exception");
        builder.Property(l => l.Properties).HasColumnName("properties").HasColumnType("jsonb");
        builder.Property(l => l.Source).HasColumnName("source").HasMaxLength(150);
        builder.Property(l => l.Endpoint).HasColumnName("endpoint").HasMaxLength(250);
        builder.Property(l => l.UserEmail).HasColumnName("user_email").HasMaxLength(150);
        builder.Property(l => l.ClientIp).HasColumnName("client_ip").HasMaxLength(50);
        builder.Property(l => l.ExecutionDurationMs).HasColumnName("execution_duration_ms");
    }
}
