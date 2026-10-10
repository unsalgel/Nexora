using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Cart.Dtos;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Cart.Queries.GetCartQuote;

public sealed record GetCartQuoteQuery(Guid UserId, string? CouponCode = null) : IRequest<Result<CartQuoteDto>>;

public sealed class GetCartQuoteQueryHandler(IApplicationDbContext context) : IRequestHandler<GetCartQuoteQuery, Result<CartQuoteDto>>
{
    public async Task<Result<CartQuoteDto>> Handle(GetCartQuoteQuery request, CancellationToken cancellationToken)
    {
        var items = await context.CartItems.AsNoTracking().Where(i => i.Cart.UserId == request.UserId)
            .Select(i => new { i.Id, i.Quantity, Price = i.ProductVariantId.HasValue ? i.ProductVariant!.Price : i.Product.Price,
                Active = i.Product.IsActive && !i.Product.IsDeleted && (!i.ProductVariantId.HasValue || (i.ProductVariant != null && i.ProductVariant.ProductId == i.ProductId && i.ProductVariant.IsActive && !i.ProductVariant.IsDeleted)) })
            .ToListAsync(cancellationToken);
        if (items.Any(i => !i.Active || i.Quantity <= 0 || i.Price <= 0))
            throw new ConflictException("Sepette satışa uygun olmayan ürün var. Sepetinizi güncelleyiniz.");
        var pricing = await CartPricing.CalculateAsync(context, items.Sum(i => i.Price * i.Quantity), request.CouponCode, cancellationToken);
        return Result<CartQuoteDto>.Success(pricing.Quote with
        {
            Items = items.Select(i => new CartQuoteItemDto(i.Id, i.Quantity, i.Price,
                Math.Round(i.Price * i.Quantity, 2, MidpointRounding.AwayFromZero))).ToList()
        });
    }
}
