using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Products.Commands.CreateProduct;

public sealed class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        await using var transaction = await _context.BeginTransactionAsync("media-reference", cancellationToken);
        await transaction.AcquireLockAsync(CatalogRelations.LockKey, cancellationToken);
        var skuExists = await _context.Products
            .AnyAsync(p => p.SKU == request.SKU, cancellationToken);

        if (skuExists)
            throw new ConflictException("Bu SKU koduna sahip bir ürün zaten mevcut.");

        await CatalogRelations.EnsureExistAsync(_context, request.CategoryId, request.BrandId, cancellationToken);

        var product = new Product
        {
            Name = request.Name,
            SKU = request.SKU,
            Description = request.Description,
            Price = request.Price,
            StockQuantity = request.StockQuantity,
            CategoryId = request.CategoryId,
            BrandId = request.BrandId,
            IsActive = true,
            IsDeleted = false
        };

        _context.Products.Add(product);

        if (request.ImageUrls != null && request.ImageUrls.Count > 0)
        {
            var isFirst = true;
            for (var i = 0; i < request.ImageUrls.Count; i++)
            {
                var url = request.ImageUrls[i];
                if (!string.IsNullOrWhiteSpace(url))
                {
                    _context.ProductImages.Add(new ProductImage
                    {
                        ProductId = product.Id,
                        ImageUrl = url.Trim(),
                        IsMain = isFirst,
                        DisplayOrder = i
                    });
                    isFirst = false;
                }
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Result<Guid>.Success(product.Id, "Ürün başarıyla oluşturuldu.");
    }
}
