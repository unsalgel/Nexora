using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Products.Commands.DeleteProductImage;

public sealed class DeleteProductImageCommandHandler : IRequestHandler<DeleteProductImageCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;

    public DeleteProductImageCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(DeleteProductImageCommand request, CancellationToken cancellationToken)
    {
        var image = await _context.ProductImages
            .FirstOrDefaultAsync(img => img.Id == request.ImageId && img.ProductId == request.ProductId, cancellationToken)
            ?? throw new NotFoundException("Silinecek ürün görseli bulunamadı.");

        _context.ProductImages.Remove(image);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success("Ürün görseli başarıyla silindi.");
    }
}
