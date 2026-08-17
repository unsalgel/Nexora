using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Nexora.Application.Abstractions;
using Nexora.Domain.Entities;
using Nexora.Persistence.Context;

namespace Nexora.Api;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IHost host)
    {
        using var scope = host.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<NexoraDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        var adminRoleId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        // 1. Admin Kullanıcısı
        var adminEmail = "admin@nexora.com";
        var existingAdmin = await context.Users.FirstOrDefaultAsync(u => u.Email == adminEmail);
        if (existingAdmin is null)
        {
            var adminId = Guid.NewGuid();
            var adminUser = new User
            {
                Id = adminId,
                Email = adminEmail,
                PasswordHash = passwordHasher.Hash("Admin123*"),
                FirstName = "Sistem",
                LastName = "Yöneticisi",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            };

            var adminUserRole = new UserRole
            {
                UserId = adminId,
                RoleId = adminRoleId
            };

            await context.Users.AddAsync(adminUser);
            await context.UserRoles.AddAsync(adminUserRole);
            await context.SaveChangesAsync();
        }
        else
        {
            existingAdmin.PasswordHash = passwordHasher.Hash("Admin123*");
            existingAdmin.IsActive = true;
            if (!await context.UserRoles.AnyAsync(ur => ur.UserId == existingAdmin.Id && ur.RoleId == adminRoleId))
            {
                await context.UserRoles.AddAsync(new UserRole
                {
                    UserId = existingAdmin.Id,
                    RoleId = adminRoleId
                });
            }
            await context.SaveChangesAsync();
        }

        // 2. Eğer Kategoriler ve Ürünler varsa tekrar ekleme
        if (await context.Categories.AnyAsync())
        {
            return;
        }

        // Kategoriler
        var catElektronik = new Category { Id = Guid.NewGuid(), Name = "Elektronik", Description = "Telefon, Bilgisayar, Kulaklık", IsActive = true, CreatedAtUtc = DateTime.UtcNow };
        var catModa = new Category { Id = Guid.NewGuid(), Name = "Moda & Giyim", Description = "Kadın, Erkek, Ayakkabı, Çanta", IsActive = true, CreatedAtUtc = DateTime.UtcNow };
        var catEv = new Category { Id = Guid.NewGuid(), Name = "Ev & Yaşam", Description = "Mobilya, Dekorasyon, Aydınlatma", IsActive = true, CreatedAtUtc = DateTime.UtcNow };
        var catKozmetik = new Category { Id = Guid.NewGuid(), Name = "Kozmetik", Description = "Cilt Bakımı, Parfüm, Makyaj", IsActive = true, CreatedAtUtc = DateTime.UtcNow };
        var catSpor = new Category { Id = Guid.NewGuid(), Name = "Spor & Outdoor", Description = "Spor Giyim, Ekipman, Kamp", IsActive = true, CreatedAtUtc = DateTime.UtcNow };

        await context.Categories.AddRangeAsync(catElektronik, catModa, catEv, catKozmetik, catSpor);

        // Markalar
        var brandSony = new Brand { Id = Guid.NewGuid(), Name = "Sony", LogoUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80", IsActive = true, CreatedAtUtc = DateTime.UtcNow };
        var brandApple = new Brand { Id = Guid.NewGuid(), Name = "Apple", LogoUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80", IsActive = true, CreatedAtUtc = DateTime.UtcNow };
        var brandNike = new Brand { Id = Guid.NewGuid(), Name = "Nike", LogoUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=80", IsActive = true, CreatedAtUtc = DateTime.UtcNow };
        var brandZara = new Brand { Id = Guid.NewGuid(), Name = "Zara", LogoUrl = "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=100&q=80", IsActive = true, CreatedAtUtc = DateTime.UtcNow };
        var brandIkea = new Brand { Id = Guid.NewGuid(), Name = "Ikea", LogoUrl = "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=100&q=80", IsActive = true, CreatedAtUtc = DateTime.UtcNow };
        var brandLoreal = new Brand { Id = Guid.NewGuid(), Name = "L'Oreal", LogoUrl = "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=100&q=80", IsActive = true, CreatedAtUtc = DateTime.UtcNow };

        await context.Brands.AddRangeAsync(brandSony, brandApple, brandNike, brandZara, brandIkea, brandLoreal);

        // Ürünler
        var p1 = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Nexora Pro Wireless Bluetooth Kulaklık Çevre Gürültü Engelleyici",
            SKU = "NX-AUD-001",
            Description = "Aktif Gürültü Engelleme (ANC), 40 saat pil ömrü, yüksek çözünürlüklü ses kalitesi ve ergonomik kafa bandı tasarımı.",
            Price = 1499.90m,
            StockQuantity = 85,
            CategoryId = catElektronik.Id,
            BrandId = brandSony.Id,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        var p2 = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Akıllı Saat GPS + Nabız Ölçer Su Geçirmez Spor Kordonlu",
            SKU = "NX-WCH-002",
            Description = "AMOLED ekran, her zaman açık ekran modu, SpO2 ve kalp ritmi takibi, 50 metre su geçirmezlik.",
            Price = 2299.00m,
            StockQuantity = 42,
            CategoryId = catElektronik.Id,
            BrandId = brandApple.Id,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        var p3 = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Ortopedik Koşu ve Yürüyüş Spor Ayakkabısı",
            SKU = "NX-SH-003",
            Description = "Hafif nefes alabilir file saya, şok emici taban yastıklaması ve günlük kullanım konforu.",
            Price = 1249.50m,
            StockQuantity = 110,
            CategoryId = catSpor.Id,
            BrandId = brandNike.Id,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        var p4 = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Erkek Premium Slim Fit Pamuklu Kumaş Gömlek",
            SKU = "NX-CLT-004",
            Description = "%100 organik pamuk kumaş, kırışmaya dayanıklı özel dokuma, modern slim fit kesim.",
            Price = 599.00m,
            StockQuantity = 65,
            CategoryId = catModa.Id,
            BrandId = brandZara.Id,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        var p5 = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Ergonomik Bel Destekli Yönetici Çalışma Koltuğu",
            SKU = "NX-FUR-005",
            Description = "Ayarlanabilir 3D kolçaklar, file sırt yapısı, senkron mekanizma ve ortopedik sünger dolgusu.",
            Price = 3499.00m,
            StockQuantity = 20,
            CategoryId = catEv.Id,
            BrandId = brandIkea.Id,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        var p6 = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Organik Yüz Bakım Serumu Cilt Yenileyici 50ml",
            SKU = "NX-COS-006",
            Description = "Hyaluronik asit, C vitamini ve kolajen içeriği ile cilde ışıltı ve canlılık kazandırır.",
            Price = 389.90m,
            StockQuantity = 95,
            CategoryId = catKozmetik.Id,
            BrandId = brandLoreal.Id,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        await context.Products.AddRangeAsync(p1, p2, p3, p4, p5, p6);

        // Ürün Resimleri
        var images = new List<ProductImage>
        {
            new() { Id = Guid.NewGuid(), ProductId = p1.Id, ImageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80", IsMain = true, DisplayOrder = 1, CreatedAtUtc = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), ProductId = p2.Id, ImageUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80", IsMain = true, DisplayOrder = 1, CreatedAtUtc = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), ProductId = p3.Id, ImageUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80", IsMain = true, DisplayOrder = 1, CreatedAtUtc = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), ProductId = p4.Id, ImageUrl = "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80", IsMain = true, DisplayOrder = 1, CreatedAtUtc = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), ProductId = p5.Id, ImageUrl = "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80", IsMain = true, DisplayOrder = 1, CreatedAtUtc = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), ProductId = p6.Id, ImageUrl = "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80", IsMain = true, DisplayOrder = 1, CreatedAtUtc = DateTime.UtcNow }
        };

        await context.ProductImages.AddRangeAsync(images);
        await context.SaveChangesAsync();
    }
}
