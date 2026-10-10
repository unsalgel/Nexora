using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Entities;

namespace Nexora.Persistence.Configurations;

public sealed class EmailVerificationCodeConfiguration : IEntityTypeConfiguration<EmailVerificationCode>
{
    public void Configure(EntityTypeBuilder<EmailVerificationCode> builder)
    {
        builder.Property(c => c.Code).HasMaxLength(64).IsRequired();
        builder.Property(c => c.TargetEmail).HasMaxLength(100);
        builder.HasIndex(c => new { c.UserId, c.CreatedAtUtc });
    }
}
