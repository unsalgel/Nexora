using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Entities;

namespace Nexora.Persistence.Configurations;

public sealed class UserAddressConfiguration : IEntityTypeConfiguration<UserAddress>
{
    public void Configure(EntityTypeBuilder<UserAddress> builder)
    {
        builder.ToTable("UserAddresses");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.UserId).IsUnique().HasFilter("\"IsDefault\" = TRUE AND \"IsDeleted\" = FALSE");
        builder.Property(x => x.Title).HasMaxLength(100).IsRequired();
        builder.Property(x => x.FullName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.PhoneNumber).HasMaxLength(20).IsRequired();
        builder.Property(x => x.City).HasMaxLength(100).IsRequired();
        builder.Property(x => x.District).HasMaxLength(100).IsRequired();
        builder.Property(x => x.DetailedAddress).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.PostalCode).HasMaxLength(5);
    }
}
