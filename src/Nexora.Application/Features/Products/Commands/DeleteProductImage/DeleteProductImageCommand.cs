using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Products.Commands.DeleteProductImage;

public sealed record DeleteProductImageCommand(
    Guid ProductId,
    Guid ImageId) : IRequest<Result<string>>;
