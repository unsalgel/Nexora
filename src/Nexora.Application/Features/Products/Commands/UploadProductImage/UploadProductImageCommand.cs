using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Products.Commands.UploadProductImage;

// Ürün görseli yükleme komutu (Clean Architecture gereği IFormFile yerine saf Stream ve dosya meta bilgileri taşır)
public sealed record UploadProductImageCommand(
    Stream FileStream,
    string FileName,
    string ContentType) : IRequest<Result<string>>;
