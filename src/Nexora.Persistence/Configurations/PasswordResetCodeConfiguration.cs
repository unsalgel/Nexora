using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Entities;

namespace Nexora.Persistence.Configurations;

public sealed class PasswordResetCodeConfiguration : IEntityTypeConfiguration<PasswordResetCode>
{
    public void Configure(EntityTypeBuilder<PasswordResetCode> builder)
    {
        builder.ToTable("PasswordResetCodes");

        builder.HasKey(prc => prc.Id);

        builder.Property(prc => prc.Code)
            .IsRequired()
            .HasMaxLength(10);

        builder.HasIndex(prc => prc.Code);
        builder.HasIndex(prc => new { prc.UserId, prc.Code, prc.IsUsed });

        builder.Property(prc => prc.ExpiresAtUtc)
            .IsRequired();

        builder.Property(prc => prc.IsUsed)
            .HasDefaultValue(false);

        builder.HasOne(prc => prc.User)
            .WithMany(u => u.PasswordResetCodes)
            .HasForeignKey(prc => prc.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
