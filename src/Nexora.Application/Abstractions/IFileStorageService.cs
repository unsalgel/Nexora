namespace Nexora.Application.Abstractions;

// Fiziksel veya bulut dosya depolama işlemleri sözleşmesi
public interface IFileStorageService
{
    // Yüklenen dosyayı doğrular, benzersiz isimle diske kaydeder ve erişilebilir bağıl URL yolunu döner.
    Task<string> SaveFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default);

    // İstenen dosyayı diskten siler.
    Task<bool> DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default);
}
