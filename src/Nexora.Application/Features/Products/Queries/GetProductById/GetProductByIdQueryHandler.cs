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
        var product = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Images)
            .Include(p => p.Variants.Where(v => !v.IsDeleted && v.IsActive))
                .ThenInclude(v => v.VariantAttributeValues)
                    .ThenInclude(vav => vav.ProductAttributeValue)
                        .ThenInclude(pav => pav.ProductAttribute)
            .FirstOrDefaultAsync(p => p.Id == request.Id && !p.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Ürün bulunamadı.");

        var imageDtos = product.Images
            .OrderBy(i => i.DisplayOrder)
            .Select(i => new ProductImageDto(i.Id, i.ImageUrl, i.IsMain, i.DisplayOrder))
            .ToList();

        var variantDtos = product.Variants
            .Select(v => new ProductVariantDto(
                v.Id,
                v.SKU,
                v.Price,
                v.StockQuantity,
                v.IsActive,
                v.VariantAttributeValues
                    .Where(vav => vav.ProductAttributeValue is not null && vav.ProductAttributeValue.ProductAttribute is not null)
                    .Select(vav => new ProductVariantAttributeValueDto(
                        vav.ProductAttributeValue.ProductAttribute.Name,
                        vav.ProductAttributeValue.Value))
                    .ToList()))
            .ToList();

        var dto = new ProductDto(
            product.Id,
            product.Name,
            product.SKU,
            product.Description,
            product.Price,
            product.StockQuantity,
            product.CategoryId,
            product.Category.Name,
            product.BrandId,
            product.Brand.Name,
            product.IsActive,
            imageDtos,
            variantDtos);

        return Result<ProductDto>.Success(dto);
    }
}
