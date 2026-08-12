using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Cart.Commands.ClearCart;

public sealed class ClearCartCommandHandler : IRequestHandler<ClearCartCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;

    public ClearCartCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(ClearCartCommand request, CancellationToken cancellationToken)
    {
        var cart = await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == request.UserId, cancellationToken)
            ?? throw new NotFoundException("Temizlenecek aktif sepet bulunamadı.");

        if (cart.Items.Count == 0)
            return Result<string>.Success("Sepetiniz zaten boş.");

        _context.CartItems.RemoveRange(cart.Items);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success("Sepetiniz başarıyla temizlendi.");
    }
}
