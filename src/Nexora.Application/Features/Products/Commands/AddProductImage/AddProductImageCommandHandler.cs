using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Products.Commands.AddProductImage;

public sealed class AddProductImageCommandHandler : IRequestHandler<AddProductImageCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public AddProductImageCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(AddProductImageCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId && !p.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Görsel eklenecek ürün bulunamadı.");

        // Eğer bu görsel ana görsel yapılıyorsa, diğer görsellerin IsMain özelliğini kaldırıyoruz.
        if (request.IsMain)
        {
            foreach (var img in product.Images)
            {
                img.IsMain = false;
            }
        }

        var productImage = new ProductImage
        {
            ProductId = request.ProductId,
            ImageUrl = request.ImageUrl,
            IsMain = request.IsMain,
            DisplayOrder = request.DisplayOrder
        };

        _context.ProductImages.Add(productImage);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(productImage.Id, "Ürün görseli başarıyla eklendi.");
    }
}
