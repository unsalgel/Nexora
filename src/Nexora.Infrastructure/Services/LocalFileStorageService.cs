using Microsoft.AspNetCore.Hosting;
using Nexora.Application.Abstractions;
using Nexora.Domain.Exceptions;

namespace Nexora.Infrastructure.Services;

// Sunucu yerel diskinde (wwwroot/uploads) dosya saklama servisi
public sealed class LocalFileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _environment;
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private static readonly string[] AllowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    private const long MaxFileSizeInBytes = 5 * 1024 * 1024; // 5 MB

    public LocalFileStorageService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        if (fileStream == null || fileStream.Length == 0)
            throw new BusinessValidationException("Yüklenecek dosya boş olamaz.");

        if (fileStream.Length > MaxFileSizeInBytes)
            throw new BusinessValidationException("Dosya boyutu en fazla 5MB olabilir.");

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension) || !AllowedMimeTypes.Contains(contentType.ToLowerInvariant()))
            throw new BusinessValidationException("Yalnızca JPG, PNG ve WEBP formatında görseller yüklenebilir.");

        // uploads dizinini garanti altına al
        var webRoot = _environment.WebRootPath;
        if (string.IsNullOrEmpty(webRoot))
        {
            webRoot = Path.Combine(_environment.ContentRootPath, "wwwroot");
        }

        var uploadsFolder = Path.Combine(webRoot, "uploads", "products");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        // Benzersiz dosya ismi üret
        var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
        var physicalPath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var destinationStream = new FileStream(physicalPath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await fileStream.CopyToAsync(destinationStream, cancellationToken);
        }

        // İstemcilerin doğrudan erişebileceği bağıl URL yolu
        return $"/uploads/products/{uniqueFileName}";
    }

    public Task<bool> DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(fileUrl))
            return Task.FromResult(false);

        try
        {
            var webRoot = _environment.WebRootPath;
            if (string.IsNullOrEmpty(webRoot))
            {
                webRoot = Path.Combine(_environment.ContentRootPath, "wwwroot");
            }

            var relativePath = fileUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var physicalPath = Path.Combine(webRoot, relativePath);

            if (File.Exists(physicalPath))
            {
                File.Delete(physicalPath);
                return Task.FromResult(true);
            }
        }
        catch
        {
            // Silme işlemi başarısız olsa bile uygulamanın akışını bozmamak için hata bastırılır
        }

        return Task.FromResult(false);
    }
}
