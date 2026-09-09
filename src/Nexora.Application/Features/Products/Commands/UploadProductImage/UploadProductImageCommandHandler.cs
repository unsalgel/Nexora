using MediatR;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Products.Commands.UploadProductImage;

// Ürün görseli yükleme komutu işleyicisi
public sealed class UploadProductImageCommandHandler : IRequestHandler<UploadProductImageCommand, Result<string>>
{
    private readonly IFileStorageService _fileStorageService;

    public UploadProductImageCommandHandler(IFileStorageService fileStorageService)
    {
        _fileStorageService = fileStorageService;
    }

    public async Task<Result<string>> Handle(UploadProductImageCommand request, CancellationToken cancellationToken)
    {
        var relativeUrl = await _fileStorageService.SaveFileAsync(
            request.FileStream,
            request.FileName,
            request.ContentType,
            cancellationToken);

        return Result<string>.Success(relativeUrl, "Görsel başarıyla yüklendi.");
    }
}
