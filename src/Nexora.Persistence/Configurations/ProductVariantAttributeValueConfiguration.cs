using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Entities;

namespace Nexora.Persistence.Configurations;

public sealed class ProductVariantAttributeValueConfiguration : IEntityTypeConfiguration<ProductVariantAttributeValue>
{
    public void Configure(EntityTypeBuilder<ProductVariantAttributeValue> builder)
    {
        builder.ToTable("ProductVariantAttributeValues");

        builder.HasKey(pvav => new { pvav.ProductVariantId, pvav.ProductAttributeValueId });

        builder.HasOne(pvav => pvav.ProductVariant)
            .WithMany(pv => pv.VariantAttributeValues)
            .HasForeignKey(pvav => pvav.ProductVariantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pvav => pvav.ProductAttributeValue)
            .WithMany()
            .HasForeignKey(pvav => pvav.ProductAttributeValueId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
