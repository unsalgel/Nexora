using Microsoft.AspNetCore.Hosting;
using Nexora.Application.Abstractions;
using Nexora.Domain.Exceptions;
using SkiaSharp;

namespace Nexora.Infrastructure.Services;

public sealed class LocalFileStorageService(IWebHostEnvironment environment) : IFileStorageService
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private const int MaxFileSizeInBytes = 5 * 1024 * 1024;
    private const int MaxDimension = 4096;
    private const long MaxPixels = 16_000_000;

    public async Task<string> SaveFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        if (fileStream is null || !fileStream.CanRead)
            throw new BusinessValidationException("Yüklenecek dosya boş olamaz.");

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var expectedMime = extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            _ => string.Empty
        };
        if (expectedMime.Length == 0 || !string.Equals(expectedMime, contentType, StringComparison.OrdinalIgnoreCase))
            throw new BusinessValidationException("Yalnızca JPG, PNG ve WEBP formatında görseller yüklenebilir.");

        using var input = new MemoryStream();
        var buffer = new byte[81920];
        int read;
        while ((read = await fileStream.ReadAsync(buffer, cancellationToken)) > 0)
        {
            if (input.Length + read > MaxFileSizeInBytes)
                throw new BusinessValidationException("Dosya boyutu en fazla 5MB olabilir.");
            await input.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
        }
        if (input.Length == 0)
            throw new BusinessValidationException("Yüklenecek dosya boş olamaz.");
        input.Position = 0;

        using var output = new MemoryStream();
        using var encodedInput = SKData.CreateCopy(input.ToArray());
        using var codec = SKCodec.Create(encodedInput);
        if (codec is null)
            throw new BusinessValidationException("Dosya içeriği geçerli bir görsel formatı (JPG, PNG, WEBP) ile eşleşmiyor.");
        var format = extension switch
        {
            ".jpg" or ".jpeg" => SKEncodedImageFormat.Jpeg,
            ".webp" => SKEncodedImageFormat.Webp,
            _ => SKEncodedImageFormat.Png
        };
        if (codec.EncodedFormat != format)
            throw new BusinessValidationException("Dosya içeriği geçerli bir görsel formatı (JPG, PNG, WEBP) ile eşleşmiyor.");
        var info = codec.Info;
        if (info.Width <= 0 || info.Height <= 0 || info.Width > MaxDimension || info.Height > MaxDimension || (long)info.Width * info.Height > MaxPixels)
            throw new BusinessValidationException("Görsel boyutları en fazla 4096x4096 ve 16 milyon piksel olabilir.");
        if (codec.FrameCount > 1)
            throw new BusinessValidationException("Animasyonlu görseller yüklenemez.");
        cancellationToken.ThrowIfCancellationRequested();
        using var bitmap = new SKBitmap(new SKImageInfo(info.Width, info.Height, SKColorType.Rgba8888, SKAlphaType.Premul));
        if (bitmap.GetPixels() == IntPtr.Zero || codec.GetPixels(bitmap.Info, bitmap.GetPixels()) != SKCodecResult.Success)
            throw new BusinessValidationException("Görsel içeriğinin tamamı okunamadı.");
        using var image = SKImage.FromBitmap(bitmap);
        using var encodedOutput = image.Encode(format, 90);
        if (encodedOutput is null)
            throw new BusinessValidationException("Görsel işlenemedi.");
        // Tam decode ve yeniden encode, eklenmiş çalıştırılabilir içeriği ve gereksiz metadata'yı taşımayı önler.
        encodedOutput.SaveTo(output);
        cancellationToken.ThrowIfCancellationRequested();
        if (output.Length > MaxFileSizeInBytes)
            throw new BusinessValidationException("İşlenmiş görsel boyutu en fazla 5MB olabilir.");

        var uploadsFolder = GetUploadsFolder();
        Directory.CreateDirectory(uploadsFolder);
        EnsureNoLinks(uploadsFolder);
        var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
        var physicalPath = Path.Combine(uploadsFolder, uniqueFileName);
        try
        {
            output.Position = 0;
            await using var destination = new FileStream(physicalPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, true);
            await output.CopyToAsync(destination, cancellationToken);
        }
        catch
        {
            File.Delete(physicalPath);
            throw;
        }
        return $"/uploads/products/{uniqueFileName}";
    }

    public Task<bool> DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (!TryGetManagedFileName(fileUrl, out var fileName))
            return Task.FromResult(false);
        var folder = GetUploadsFolder();
        if (!Directory.Exists(folder))
            return Task.FromResult(false);
        EnsureNoLinks(folder);
        var path = Path.Combine(folder, fileName);
        if (!File.Exists(path) || (File.GetAttributes(path) & FileAttributes.ReparsePoint) != 0)
            return Task.FromResult(false);
        File.Delete(path);
        return Task.FromResult(true);
    }

    internal static bool TryGetManagedFileName(string? fileUrl, out string fileName)
    {
        fileName = string.Empty;
        const string prefix = "/uploads/products/";
        if (fileUrl is null || !fileUrl.StartsWith(prefix, StringComparison.Ordinal))
            return false;
        var candidate = fileUrl[prefix.Length..];
        if (candidate.IndexOfAny(['/', '\\', '?', '#', '%', ':']) >= 0)
            return false;
        var extension = Path.GetExtension(candidate).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension) || !Guid.TryParseExact(Path.GetFileNameWithoutExtension(candidate), "N", out _))
            return false;
        fileName = candidate;
        return true;
    }

    private string GetUploadsFolder() => Path.GetFullPath(Path.Combine(
        string.IsNullOrEmpty(environment.WebRootPath) ? Path.Combine(environment.ContentRootPath, "wwwroot") : environment.WebRootPath,
        "uploads", "products"));

    private static void EnsureNoLinks(string folder)
    {
        for (var directory = new DirectoryInfo(folder); directory is not null; directory = directory.Parent)
            if ((directory.Attributes & FileAttributes.ReparsePoint) != 0)
                throw new IOException("Görsel depolama yolunda sembolik bağlantı kullanılamaz.");
    }

}
