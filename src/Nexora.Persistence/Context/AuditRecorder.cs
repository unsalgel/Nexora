using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Domain.Entities;

namespace Nexora.Persistence.Context;

internal static class AuditRecorder
{
    private static readonly Dictionary<Type, string[]> Fields = new()
    {
        [typeof(Product)] = ["SKU", "Price", "StockQuantity", "IsActive", "IsDeleted", "CategoryId", "BrandId"],
        [typeof(ProductVariant)] = ["SKU", "Price", "StockQuantity", "IsActive", "IsDeleted"],
        [typeof(User)] = ["IsActive"],
        [typeof(UserRole)] = ["UserId", "RoleId"],
        [typeof(Setting)] = ["Key", "Value"],
        [typeof(ProductAttribute)] = ["Name"],
        [typeof(ProductAttributeValue)] = ["ProductAttributeId", "Value"]
    };
    private static readonly HashSet<string> PublicSettings = ["SiteTitle", "FreeShippingThreshold", "ShippingCost", "AnnouncementText", "IsAnnouncementActive"];

    public static void Record(NexoraDbContext context, IAuditContext? actor)
    {
        var records = new List<AuditEntry>();
        foreach (var entry in context.ChangeTracker.Entries().ToArray())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified or EntityState.Deleted) ||
                !Fields.TryGetValue(entry.Entity.GetType(), out var fields)) continue;
            var changes = new Dictionary<string, object>();
            foreach (var field in fields)
            {
                if (entry.Entity is Setting setting && field == "Value" && !PublicSettings.Contains(setting.Key)) continue;
                var property = entry.Property(field);
                if (entry.State == EntityState.Modified && !property.IsModified) continue;
                changes[field] = new
                {
                    Before = entry.State == EntityState.Added ? null : property.OriginalValue,
                    After = entry.State == EntityState.Deleted ? null : property.CurrentValue
                };
            }
            if (changes.Count == 0) continue;
            records.Add(new AuditEntry
            {
                ActorId = actor?.ActorId, TraceId = actor?.TraceId ?? "background",
                EntityType = entry.Metadata.ClrType.Name,
                EntityId = string.Join(":", entry.Properties.Where(p => p.Metadata.IsPrimaryKey()).Select(p => p.CurrentValue)),
                Action = entry.State.ToString(), Changes = JsonSerializer.Serialize(changes)
            });
        }
        context.AuditEntries.AddRange(records);
    }
}
