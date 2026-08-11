using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.ProductVariants.Commands.DeleteProductVariant;

public sealed class DeleteProductVariantCommandHandler : IRequestHandler<DeleteProductVariantCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;

    public DeleteProductVariantCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(DeleteProductVariantCommand request, CancellationToken cancellationToken)
    {
        var variant = await _context.ProductVariants
            .FirstOrDefaultAsync(v => v.Id == request.Id && !v.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Silinecek varyant bulunamadı.");

        variant.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success("Ürün varyantı başarıyla silindi.");
    }
}
