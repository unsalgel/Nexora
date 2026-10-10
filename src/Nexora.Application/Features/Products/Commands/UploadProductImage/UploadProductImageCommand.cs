using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Products.Commands.UploadProductImage;

public sealed record UploadProductImageCommand(
    Stream FileStream,
    string FileName,
    string ContentType) : IRequest<Result<string>>;
