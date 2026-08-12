using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Cart.Commands.UpdateCartItemQuantity;

public sealed class UpdateCartItemQuantityCommandHandler : IRequestHandler<UpdateCartItemQuantityCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;

    public UpdateCartItemQuantityCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(UpdateCartItemQuantityCommand request, CancellationToken cancellationToken)
    {
        var cartItem = await _context.CartItems
            .Include(ci => ci.Cart)
            .Include(ci => ci.Product)
            .Include(ci => ci.ProductVariant)
            .FirstOrDefaultAsync(ci => ci.Id == request.CartItemId && ci.Cart.UserId == request.UserId, cancellationToken)
            ?? throw new NotFoundException("Sepet kalemi bulunamadı.");

        var availableStock = cartItem.ProductVariant?.StockQuantity ?? cartItem.Product.StockQuantity;

        if (request.Quantity > availableStock)
            throw new ConflictException($"Yetersiz stok. Mevcut stok: {availableStock}");

        cartItem.Quantity = request.Quantity;
        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success("Ürün adedi başarıyla güncellendi.");
    }
}
