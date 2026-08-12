using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Favorites.Commands.RemoveFavorite;

public sealed class RemoveFavoriteCommandHandler : IRequestHandler<RemoveFavoriteCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;

    public RemoveFavoriteCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(RemoveFavoriteCommand request, CancellationToken cancellationToken)
    {
        var favorite = await _context.Favorites
            .FirstOrDefaultAsync(f => f.UserId == request.UserId && f.ProductId == request.ProductId, cancellationToken)
            ?? throw new NotFoundException("Favorilerinizde bu ürün bulunamadı.");

        _context.Favorites.Remove(favorite);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success("Ürün favorilerinizden çıkarıldı.");
    }
}
