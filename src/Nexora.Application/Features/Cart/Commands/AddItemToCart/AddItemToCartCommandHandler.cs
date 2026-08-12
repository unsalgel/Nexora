using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using DomainEntities = Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Cart.Commands.AddItemToCart;

public sealed class AddItemToCartCommandHandler : IRequestHandler<AddItemToCartCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public AddItemToCartCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(AddItemToCartCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.ProductId && p.IsActive && !p.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Sepete eklenecek ürün bulunamadı.");

        DomainEntities.ProductVariant? variant = null;
        if (request.ProductVariantId.HasValue)
        {
            variant = await _context.ProductVariants
                .FirstOrDefaultAsync(v => v.Id == request.ProductVariantId.Value && v.ProductId == request.ProductId && v.IsActive && !v.IsDeleted, cancellationToken)
                ?? throw new NotFoundException("Seçilen ürün varyantı bulunamadı.");
        }

        // Stok Kontrolü
        var availableStock = variant?.StockQuantity ?? product.StockQuantity;

        var cart = await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == request.UserId, cancellationToken);

        if (cart == null)
        {
            cart = new DomainEntities.Cart
            {
                UserId = request.UserId
            };
            _context.Carts.Add(cart);
        }

        var existingItem = cart.Items
            .FirstOrDefault(i => i.ProductId == request.ProductId && i.ProductVariantId == request.ProductVariantId);

        var currentCartQuantity = existingItem?.Quantity ?? 0;
        var requestedTotalQuantity = currentCartQuantity + request.Quantity;

        if (requestedTotalQuantity > availableStock)
            throw new ConflictException($"Yetersiz stok. Mevcut stok: {availableStock}");

        if (existingItem != null)
        {
            existingItem.Quantity = requestedTotalQuantity;
        }
        else
        {
            var cartItem = new DomainEntities.CartItem
            {
                ProductId = request.ProductId,
                ProductVariantId = request.ProductVariantId,
                Quantity = request.Quantity
            };
            cart.Items.Add(cartItem);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(cart.Id, "Ürün başarıyla sepete eklendi.");
    }
}
