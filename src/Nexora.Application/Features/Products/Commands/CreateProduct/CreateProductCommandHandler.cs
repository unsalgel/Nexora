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
        var skuExists = await _context.Products
            .AnyAsync(p => p.SKU == request.SKU && !p.IsDeleted, cancellationToken);

        if (skuExists)
            throw new ConflictException("Bu SKU koduna sahip bir ürün zaten mevcut.");

        var categoryExists = await _context.Categories
            .AnyAsync(c => c.Id == request.CategoryId && !c.IsDeleted, cancellationToken);

        if (!categoryExists)
            throw new NotFoundException("Seçilen kategori bulunamadı.");

        var brandExists = await _context.Brands
            .AnyAsync(b => b.Id == request.BrandId && !b.IsDeleted, cancellationToken);

        if (!brandExists)
            throw new NotFoundException("Seçilen marka bulunamadı.");

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
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(product.Id, "Ürün başarıyla oluşturuldu.");
    }
}
