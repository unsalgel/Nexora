using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Products.Dtos;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Products.Queries.GetProductById;

public sealed class GetProductByIdQueryHandler : IRequestHandler<GetProductByIdQuery, Result<ProductDto>>
{
    private readonly IApplicationDbContext _context;

    public GetProductByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<ProductDto>> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        var productDto = await _context.Products
            .AsNoTracking()
            .Where(p => p.Id == request.Id && !p.IsDeleted)
            .Select(p => new ProductDto(
                p.Id,
                p.Name,
                p.SKU,
                p.Description,
                p.Price,
                p.StockQuantity,
                p.CategoryId,
                p.Category.Name,
                p.BrandId,
                p.Brand.Name,
                p.IsActive,
                p.Images
                    .OrderBy(i => i.DisplayOrder)
                    .Select(i => new ProductImageDto(i.Id, i.ImageUrl, i.IsMain, i.DisplayOrder))
                    .ToList(),
                p.Variants
                    .Where(v => !v.IsDeleted && v.IsActive)
                    .Select(v => new ProductVariantDto(
                        v.Id,
                        v.SKU,
                        v.Price,
                        v.StockQuantity,
                        v.IsActive,
                        v.VariantAttributeValues
                            .Where(vav => vav.ProductAttributeValue != null && vav.ProductAttributeValue.ProductAttribute != null)
                            .Select(vav => new ProductVariantAttributeValueDto(
                                vav.ProductAttributeValue.ProductAttribute.Name,
                                vav.ProductAttributeValue.Value))
                            .ToList()))
                    .ToList()))
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Ürün bulunamadı.");

        return Result<ProductDto>.Success(productDto);
    }
}
