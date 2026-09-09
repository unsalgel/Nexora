using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Products.Commands.UpdateProduct;

public sealed record UpdateProductCommand(
    Guid Id,
    string Name,
    string SKU,
    string? Description,
    decimal Price,
    int StockQuantity,
    Guid CategoryId,
    Guid BrandId,
    bool IsActive,
    string? MainImageUrl = null) : IRequest<Result<string>>;
