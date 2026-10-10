using System.Linq.Expressions;
using Hangfire;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Infrastructure.Services;

namespace Nexora.Infrastructure.BackgroundJobs;

public sealed class FileCleanupJob(IApplicationDbContext context, IWebHostEnvironment environment,
    IFileStorageService storage, ILogger<FileCleanupJob> logger)
{
    [DisableConcurrentExecution(120)]
    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        var folder = Path.Combine(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"), "uploads", "products");
        if (!Directory.Exists(folder)) return;
        var cutoff = DateTime.UtcNow.AddHours(-24);
        var candidates = Directory.EnumerateFiles(folder, "*", SearchOption.TopDirectoryOnly)
            .Select(path => new FileInfo(path))
            .Where(file => (file.Attributes & FileAttributes.ReparsePoint) == 0 && file.LastWriteTimeUtc < cutoff)
            .Select(file => "/uploads/products/" + file.Name)
            .Where(url => LocalFileStorageService.TryGetManagedFileName(url, out _));
        var removed = 0;

        foreach (var batch in candidates.Chunk(100))
        {
            // Referans yazan komutlar aynı kilidi kullanır; bağlı bir dosya kontrol ile silme arasında kaybolamaz.
            await using var transaction = await context.BeginTransactionAsync("media-reference", cancellationToken);
            var fileNames = batch.Select(url => Path.GetFileName(url).ToLowerInvariant()).ToArray();
            var imageRefs = await context.ProductImages.AsNoTracking()
                .Where(ReferencesAnyFile<Nexora.Domain.Entities.ProductImage>(x => x.ImageUrl, fileNames))
                .Select(x => x.ImageUrl).Distinct().ToListAsync(cancellationToken);
            var brandRefs = await context.Brands.AsNoTracking()
                .Where(ReferencesAnyFile<Nexora.Domain.Entities.Brand>(x => x.LogoUrl, fileNames))
                .Select(x => x.LogoUrl!).Distinct().ToListAsync(cancellationToken);
            // Absolute URL ve cache query'si de aynı GUID dosyaya işaret edebilir; silme kararında konservatif kal.
            var references = batch.Where(url => imageRefs.Concat(brandRefs)
                    .Any(reference => reference.Contains(Path.GetFileName(url), StringComparison.OrdinalIgnoreCase)))
                .ToHashSet(StringComparer.Ordinal);
            foreach (var url in batch.Where(url => !references.Contains(url)))
            {
                try
                {
                    if (await storage.DeleteFileAsync(url, cancellationToken)) removed++;
                }
                catch (IOException ex)
                {
                    logger.LogWarning(ex, "Sahipsiz görsel silinemedi: {Url}", url);
                }
            }
            await transaction.CommitAsync(cancellationToken);
        }
        logger.LogInformation("{Count} adet referanssız görsel temizlendi.", removed);
    }

    private static Expression<Func<TEntity, bool>> ReferencesAnyFile<TEntity>(
        Expression<Func<TEntity, string?>> selector, IReadOnlyList<string> fileNames)
    {
        // En fazla 100 dosya adıyla sınırlı OR; PostgreSQL ve InMemory aynı sorgu biçimini çevirebilir.
        var value = selector.Body;
        var lower = Expression.Call(value, nameof(string.ToLower), Type.EmptyTypes);
        Expression matches = Expression.Constant(false);
        foreach (var fileName in fileNames)
        {
            var contains = Expression.Call(lower, nameof(string.Contains), Type.EmptyTypes, Expression.Constant(fileName));
            matches = Expression.OrElse(matches, contains);
        }
        var hasValue = Expression.NotEqual(value, Expression.Constant(null, typeof(string)));
        return Expression.Lambda<Func<TEntity, bool>>(Expression.AndAlso(hasValue, matches), selector.Parameters);
    }
}
