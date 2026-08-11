using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.ProductVariants.Commands.UpdateProductVariant;

public sealed record UpdateProductVariantCommand(
    Guid Id,
    string SKU,
    decimal Price,
    int StockQuantity,
    bool IsActive) : IRequest<Result<string>>;
