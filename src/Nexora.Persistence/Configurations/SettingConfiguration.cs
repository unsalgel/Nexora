using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Entities;

namespace Nexora.Persistence.Configurations;

public sealed class SettingConfiguration : IEntityTypeConfiguration<Setting>
{
    public void Configure(EntityTypeBuilder<Setting> builder)
    {
        builder.ToTable("Settings");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Key)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(s => s.Key)
            .IsUnique();

        builder.Property(s => s.Value)
            .IsRequired();

        builder.Property(s => s.Description)
            .HasMaxLength(250);
    }
}
