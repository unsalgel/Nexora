using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Products.Commands.CreateProduct;

public sealed record CreateProductCommand(
    string Name,
    string SKU,
    string? Description,
    decimal Price,
    int StockQuantity,
    Guid CategoryId,
    Guid BrandId) : IRequest<Result<Guid>>;
