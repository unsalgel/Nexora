using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Entities;

namespace Nexora.Persistence.Configurations;

public sealed class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> builder)
    {
        builder.ToTable("ProductVariants");

        builder.HasKey(pv => pv.Id);

        builder.Property(pv => pv.SKU)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(pv => pv.SKU)
            .IsUnique();

        builder.Property(pv => pv.Price)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(pv => pv.StockQuantity)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(pv => pv.IsActive)
            .HasDefaultValue(true);

        builder.Property(pv => pv.IsDeleted)
            .HasDefaultValue(false);

        builder.HasOne(pv => pv.Product)
            .WithMany(p => p.Variants)
            .HasForeignKey(pv => pv.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
