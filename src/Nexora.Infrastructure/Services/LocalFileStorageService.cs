using Microsoft.AspNetCore.Hosting;
using Nexora.Application.Abstractions;
using Nexora.Domain.Exceptions;

namespace Nexora.Infrastructure.Services;

public sealed class LocalFileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _environment;
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private static readonly string[] AllowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    private const long MaxFileSizeInBytes = 5 * 1024 * 1024;

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

        if (!fileStream.CanSeek)
        {
            var ms = new MemoryStream();
            await fileStream.CopyToAsync(ms, cancellationToken);
            ms.Position = 0;
            fileStream = ms;
        }

        var header = new byte[12];
        var bytesRead = await fileStream.ReadAsync(header.AsMemory(0, 12), cancellationToken);
        fileStream.Position = 0;

        if (bytesRead < 12 || !IsValidImageSignature(header, extension))
        {
            throw new BusinessValidationException("Dosya içeriği geçerli bir görsel formatı (JPG, PNG, WEBP) ile eşleşmiyor.");
        }

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

        var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
        var physicalPath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var destinationStream = new FileStream(physicalPath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await fileStream.CopyToAsync(destinationStream, cancellationToken);
        }

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
        }

        return Task.FromResult(false);
    }

    private static bool IsValidImageSignature(byte[] header, string extension)
    {
        if (header.Length < 12)
            return false;

        return extension switch
        {
            ".jpg" or ".jpeg" => header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
            ".png" => header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47,
            ".webp" => header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46
                       && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50,
            _ => false
        };
    }
}
