using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Products.Commands.AddProductImage;

public sealed record AddProductImageCommand(
    Guid ProductId,
    string ImageUrl,
    bool IsMain,
    int DisplayOrder) : IRequest<Result<Guid>>;
