using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Entities;

namespace Nexora.Persistence.Configurations;

public sealed class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> builder)
    {
        builder.ToTable("CartItems");

        builder.HasKey(ci => ci.Id);
        builder.HasIndex(ci => new { ci.CartId, ci.ProductId, ci.ProductVariantId })
            .IsUnique().HasFilter("\"ProductVariantId\" IS NOT NULL");
        builder.HasIndex(ci => new { ci.CartId, ci.ProductId })
            .IsUnique().HasFilter("\"ProductVariantId\" IS NULL");
        builder.ToTable("CartItems", t => t.HasCheckConstraint("CK_CartItems_Quantity", "\"Quantity\" > 0"));

        builder.Property(ci => ci.Quantity)
            .IsRequired()
            .HasDefaultValue(1);

        builder.HasOne(ci => ci.Cart)
            .WithMany(c => c.Items)
            .HasForeignKey(ci => ci.CartId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ci => ci.Product)
            .WithMany()
            .HasForeignKey(ci => ci.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ci => ci.ProductVariant)
            .WithMany()
            .HasForeignKey(ci => ci.ProductVariantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
