using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Favorites.Commands.AddFavorite;

public sealed class AddFavoriteCommandHandler : IRequestHandler<AddFavoriteCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public AddFavoriteCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(AddFavoriteCommand request, CancellationToken cancellationToken)
    {
        var productExists = await _context.Products
            .AnyAsync(p => p.Id == request.ProductId && p.IsActive && !p.IsDeleted, cancellationToken);

        if (!productExists)
            throw new NotFoundException("Favorilere eklenecek ürün bulunamadı.");

        var isAlreadyFavorite = await _context.Favorites
            .AnyAsync(f => f.UserId == request.UserId && f.ProductId == request.ProductId, cancellationToken);

        if (isAlreadyFavorite)
            throw new ConflictException("Bu ürün zaten favorilerinizde ekli.");

        var favorite = new Favorite
        {
            UserId = request.UserId,
            ProductId = request.ProductId
        };

        _context.Favorites.Add(favorite);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(favorite.Id, "Ürün favorilere eklendi.");
    }
}
