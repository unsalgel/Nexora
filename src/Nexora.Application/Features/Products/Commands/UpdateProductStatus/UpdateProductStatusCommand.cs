using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Products.Commands.UpdateProductStatus;

public sealed record UpdateProductStatusCommand(Guid Id, bool IsActive) : IRequest<Result<string>>;

public sealed class UpdateProductStatusCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateProductStatusCommand, Result<string>>
{
    public async Task<Result<string>> Handle(UpdateProductStatusCommand request, CancellationToken cancellationToken)
    {
        await using var transaction = await context.BeginTransactionAsync(CatalogRelations.LockKey, cancellationToken);
        var product = await context.Products.FirstOrDefaultAsync(p => p.Id == request.Id && !p.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Ürün bulunamadı.");
        if (request.IsActive)
            await CatalogRelations.EnsureExistAsync(context, product.CategoryId, product.BrandId, cancellationToken);
        product.IsActive = request.IsActive;
        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Result<string>.Success("Ürün durumu güncellendi.");
    }
}
