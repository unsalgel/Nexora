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
        await using var transaction = await _context.BeginTransactionAsync("media-reference", cancellationToken);
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.Id && !p.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Güncellenecek ürün bulunamadı.");

        if (request.Version == 0 || request.Version != product.Version)
            throw new ConflictException("Ürün bilgileri değişti. Sayfayı yenileyip tekrar deneyiniz.");

        await transaction.AcquireLockAsync(CatalogRelations.LockKey, cancellationToken);
        var skuExists = await _context.Products
            .AnyAsync(p => p.SKU == request.SKU && p.Id != request.Id, cancellationToken);

        if (skuExists)
            throw new ConflictException("Bu SKU koduna sahip başka bir ürün zaten mevcut.");

        await CatalogRelations.EnsureExistAsync(_context, request.CategoryId, request.BrandId, cancellationToken);

        product.Name = request.Name;
        product.SKU = request.SKU;
        product.Description = request.Description;
        product.Price = request.Price;
        product.StockQuantity = request.StockQuantity;
        product.CategoryId = request.CategoryId;
        product.BrandId = request.BrandId;
        product.IsActive = request.IsActive;

        if (request.RemoveMainImage)
        {
            if (!string.IsNullOrWhiteSpace(request.MainImageUrl))
                throw new BusinessValidationException("Görsel kaldırma ve değiştirme aynı istekte yapılamaz.");
            var images = await _context.ProductImages.Where(i => i.ProductId == product.Id)
                .OrderByDescending(i => i.IsMain).ThenBy(i => i.DisplayOrder).ThenBy(i => i.Id)
                .ToListAsync(cancellationToken);
            if (images.Count > 0)
            {
                _context.ProductImages.Remove(images[0]);
                for (var i = 1; i < images.Count; i++) images[i].IsMain = i == 1;
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.MainImageUrl))
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
        await transaction.CommitAsync(cancellationToken);

        return Result<string>.Success("Ürün başarıyla güncellendi.");
    }
}
