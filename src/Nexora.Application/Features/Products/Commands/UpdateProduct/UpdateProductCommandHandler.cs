using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Products.Commands.UpdateProduct;

public sealed class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;

    public UpdateProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.Id && !p.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Güncellenecek ürün bulunamadı.");

        var skuExists = await _context.Products
            .AnyAsync(p => p.SKU == request.SKU && p.Id != request.Id && !p.IsDeleted, cancellationToken);

        if (skuExists)
            throw new ConflictException("Bu SKU koduna sahip başka bir ürün zaten mevcut.");

        var categoryExists = await _context.Categories
            .AnyAsync(c => c.Id == request.CategoryId && !c.IsDeleted, cancellationToken);

        if (!categoryExists)
            throw new NotFoundException("Seçilen kategori bulunamadı.");

        var brandExists = await _context.Brands
            .AnyAsync(b => b.Id == request.BrandId && !b.IsDeleted, cancellationToken);

        if (!brandExists)
            throw new NotFoundException("Seçilen marka bulunamadı.");

        product.Name = request.Name;
        product.SKU = request.SKU;
        product.Description = request.Description;
        product.Price = request.Price;
        product.StockQuantity = request.StockQuantity;
        product.CategoryId = request.CategoryId;
        product.BrandId = request.BrandId;
        product.IsActive = request.IsActive;

        if (!string.IsNullOrWhiteSpace(request.MainImageUrl))
        {
            var existingImages = await _context.ProductImages
                .Where(pi => pi.ProductId == product.Id)
                .ToListAsync(cancellationToken);

            var matchedImage = existingImages.FirstOrDefault(pi => pi.ImageUrl == request.MainImageUrl);
            if (matchedImage != null)
            {
                foreach (var img in existingImages)
                {
                    img.IsMain = (img.Id == matchedImage.Id);
                }
            }
            else
            {
                foreach (var img in existingImages)
                {
                    img.IsMain = false;
                }

                _context.ProductImages.Add(new Nexora.Domain.Entities.ProductImage
                {
                    ProductId = product.Id,
                    ImageUrl = request.MainImageUrl,
                    IsMain = true,
                    DisplayOrder = 0
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success("Ürün başarıyla güncellendi.");
    }
}
