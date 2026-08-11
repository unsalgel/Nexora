using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.ProductVariants.Commands.DeleteProductVariant;

public sealed record DeleteProductVariantCommand(Guid Id) : IRequest<Result<string>>;
