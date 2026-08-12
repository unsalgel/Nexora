using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Cart.Commands.RemoveItemFromCart;

public sealed class RemoveItemFromCartCommandHandler : IRequestHandler<RemoveItemFromCartCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;

    public RemoveItemFromCartCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(RemoveItemFromCartCommand request, CancellationToken cancellationToken)
    {
        var cartItem = await _context.CartItems
            .Include(ci => ci.Cart)
            .FirstOrDefaultAsync(ci => ci.Id == request.CartItemId && ci.Cart.UserId == request.UserId, cancellationToken)
            ?? throw new NotFoundException("Silinecek sepet kalemi bulunamadı.");

        _context.CartItems.Remove(cartItem);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success("Ürün sepetten çıkarıldı.");
    }
}
