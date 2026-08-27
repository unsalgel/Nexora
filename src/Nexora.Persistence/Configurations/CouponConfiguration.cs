using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Entities;

namespace Nexora.Persistence.Configurations;

public sealed class CouponConfiguration : IEntityTypeConfiguration<Coupon>
{
    public void Configure(EntityTypeBuilder<Coupon> builder)
    {
        builder.ToTable("Coupons");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(c => c.Code)
            .IsUnique();

        builder.Property(c => c.DiscountValue)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(c => c.MinimumOrderAmount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(c => c.MaximumDiscountAmount)
            .HasPrecision(18, 2);

        builder.Property(c => c.DiscountType)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(c => c.IsActive)
            .IsRequired();

        builder.Property(c => c.IsDeleted)
            .IsRequired();
    }
}
