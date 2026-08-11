using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.ProductVariants.Commands.CreateProductVariant;

public sealed record CreateProductVariantCommand(
    Guid ProductId,
    string SKU,
    decimal Price,
    int StockQuantity,
    List<Guid> AttributeValueIds) : IRequest<Result<Guid>>;
