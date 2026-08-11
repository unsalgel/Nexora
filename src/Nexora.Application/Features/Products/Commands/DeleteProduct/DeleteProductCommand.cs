using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Products.Commands.DeleteProduct;

public sealed record DeleteProductCommand(Guid Id) : IRequest<Result<string>>;
