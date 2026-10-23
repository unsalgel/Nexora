using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Products;

public static class CatalogRelations
{
    // Existing media/category locks are acquired first; never acquire them after this lock.
    public const string LockKey = "catalog-relations";

    public static async Task EnsureExistAsync(IApplicationDbContext context, Guid categoryId, Guid brandId, CancellationToken ct)
    {
        if (!await context.Categories.AnyAsync(c => c.Id == categoryId && !c.IsDeleted, ct))
            throw new NotFoundException("Seçilen kategori bulunamadı.");
        if (!await context.Brands.AnyAsync(b => b.Id == brandId && !b.IsDeleted, ct))
            throw new NotFoundException("Seçilen marka bulunamadı.");
    }
}
