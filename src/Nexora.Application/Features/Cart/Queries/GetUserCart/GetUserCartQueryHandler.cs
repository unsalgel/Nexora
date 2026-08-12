using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Cart.Dtos;

namespace Nexora.Application.Features.Cart.Queries.GetUserCart;

public sealed class GetUserCartQueryHandler : IRequestHandler<GetUserCartQuery, Result<CartDto>>
{
    private readonly IApplicationDbContext _context;

    public GetUserCartQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CartDto>> Handle(GetUserCartQuery request, CancellationToken cancellationToken)
    {
        var cart = await _context.Carts
            .AsNoTracking()
            .Include(c => c.Items)
                .ThenInclude(ci => ci.Product)
                    .ThenInclude(p => p.Images)
            .Include(c => c.Items)
                .ThenInclude(ci => ci.ProductVariant)
                    .ThenInclude(pv => pv!.VariantAttributeValues)
                        .ThenInclude(vav => vav.ProductAttributeValue)
            .FirstOrDefaultAsync(c => c.UserId == request.UserId, cancellationToken);

        if (cart == null)
        {
            return Result<CartDto>.Success(new CartDto(Guid.Empty, request.UserId, new List<CartItemDto>(), 0));
        }

        var itemDtos = cart.Items.Select(ci =>
        {
            var unitPrice = ci.ProductVariant != null ? ci.ProductVariant.Price : ci.Product.Price;
            var totalPrice = unitPrice * ci.Quantity;
            var mainImageUrl = ci.Product.Images
                .OrderByDescending(img => img.IsMain)
                .Select(img => img.ImageUrl)
                .FirstOrDefault();

            var variantAttributeValues = ci.ProductVariant?.VariantAttributeValues
                .Select(vav => vav.ProductAttributeValue.Value)
                .ToList();

            return new CartItemDto(
                ci.Id,
                ci.ProductId,
                ci.Product.Name,
                mainImageUrl,
                ci.ProductVariantId,
                ci.ProductVariant?.SKU,
                variantAttributeValues,
                unitPrice,
                ci.Quantity,
                totalPrice);
        }).ToList();

        var grandTotal = itemDtos.Sum(i => i.TotalPrice);

        var cartDto = new CartDto(cart.Id, cart.UserId, itemDtos, grandTotal);

        return Result<CartDto>.Success(cartDto);
    }
}
