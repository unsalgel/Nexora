using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Nexora.Domain.Entities;
using Nexora.Persistence.Context;

namespace Nexora.Api;

public static class VariantSeeder
{
    public static async Task SeedVariantsAsync(IHost host)
    {
        using var scope = host.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<NexoraDbContext>();

        // Zaten varyant eklenmişse çık
        if (await context.ProductVariants.AnyAsync()) return;

        // Beden ve Renk Nitelikleri
        var sizeAttr = await context.ProductAttributes.FirstOrDefaultAsync(a => a.Name == "Beden");
        if (sizeAttr is null)
        {
            sizeAttr = new ProductAttribute { Id = Guid.NewGuid(), Name = "Beden", CreatedAtUtc = DateTime.UtcNow };
            await context.ProductAttributes.AddAsync(sizeAttr);
            await context.SaveChangesAsync();
        }

        var colorAttr = await context.ProductAttributes.FirstOrDefaultAsync(a => a.Name == "Renk");
        if (colorAttr is null)
        {
            colorAttr = new ProductAttribute { Id = Guid.NewGuid(), Name = "Renk", CreatedAtUtc = DateTime.UtcNow };
            await context.ProductAttributes.AddAsync(colorAttr);
            await context.SaveChangesAsync();
        }

        // Değerler
        var sizes = new[] { "S", "M", "L", "XL" };
        var sizeValues = new System.Collections.Generic.Dictionary<string, ProductAttributeValue>();
        foreach (var s in sizes)
        {
            var val = await context.ProductAttributeValues.FirstOrDefaultAsync(v => v.ProductAttributeId == sizeAttr.Id && v.Value == s);
            if (val is null)
            {
                val = new ProductAttributeValue { Id = Guid.NewGuid(), ProductAttributeId = sizeAttr.Id, Value = s, CreatedAtUtc = DateTime.UtcNow };
                await context.ProductAttributeValues.AddAsync(val);
            }
            sizeValues[s] = val;
        }

        var colors = new[] { "Siyah", "Beyaz", "Lacivert", "Kırmızı" };
        var colorValues = new System.Collections.Generic.Dictionary<string, ProductAttributeValue>();
        foreach (var c in colors)
        {
            var val = await context.ProductAttributeValues.FirstOrDefaultAsync(v => v.ProductAttributeId == colorAttr.Id && v.Value == c);
            if (val is null)
            {
                val = new ProductAttributeValue { Id = Guid.NewGuid(), ProductAttributeId = colorAttr.Id, Value = c, CreatedAtUtc = DateTime.UtcNow };
                await context.ProductAttributeValues.AddAsync(val);
            }
            colorValues[c] = val;
        }

        await context.SaveChangesAsync();

        // Giyim ve Ayakkabı ürünlerine varyant bağlama
        var apparelProducts = await context.Products
            .Where(p => p.Name.Contains("Tişört") || p.Name.Contains("Mont") || p.Name.Contains("Gömlek") || p.Name.Contains("Ayakkabı"))
            .ToListAsync();

        foreach (var prod in apparelProducts)
        {
            var isShoe = prod.Name.Contains("Ayakkabı");
            var varSizes = isShoe ? new[] { "40", "41", "42", "43", "44" } : new[] { "S", "M", "L", "XL" };

            // Ayakkabı için numaraları ekle
            if (isShoe)
            {
                foreach (var num in varSizes)
                {
                    if (!sizeValues.ContainsKey(num))
                    {
                        var val = await context.ProductAttributeValues.FirstOrDefaultAsync(v => v.ProductAttributeId == sizeAttr.Id && v.Value == num);
                        if (val is null)
                        {
                            val = new ProductAttributeValue { Id = Guid.NewGuid(), ProductAttributeId = sizeAttr.Id, Value = num, CreatedAtUtc = DateTime.UtcNow };
                            await context.ProductAttributeValues.AddAsync(val);
                        }
                        sizeValues[num] = val;
                    }
                }
                await context.SaveChangesAsync();
            }

            int count = 1;
            foreach (var s in varSizes)
            {
                var v = new ProductVariant
                {
                    Id = Guid.NewGuid(),
                    ProductId = prod.Id,
                    SKU = $"{prod.SKU}-{s}",
                    Price = prod.Price,
                    StockQuantity = count % 2 == 0 ? 15 : 5, // Gerçekçi stok dağılımı
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                };

                v.VariantAttributeValues.Add(new ProductVariantAttributeValue
                {
                    ProductVariantId = v.Id,
                    ProductAttributeValueId = sizeValues[s].Id
                });

                await context.ProductVariants.AddAsync(v);
                count++;
            }
        }

        await context.SaveChangesAsync();
    }
}
