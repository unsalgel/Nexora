using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Reviews.Commands.CreateReview;

public sealed class CreateReviewCommandHandler : IRequestHandler<CreateReviewCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateReviewCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateReviewCommand request, CancellationToken cancellationToken)
    {
        var productExists = await _context.Products
            .AnyAsync(p => p.Id == request.ProductId && p.IsActive && !p.IsDeleted, cancellationToken);

        if (!productExists)
            throw new NotFoundException("Değerlendirilecek ürün bulunamadı.");

        if (request.Rating < 1 || request.Rating > 5)
            throw new ArgumentException("Puanlama değeri 1 ile 5 arasında olmalıdır.");

        var hasAlreadyReviewed = await _context.Reviews
            .AnyAsync(r => r.UserId == request.UserId && r.ProductId == request.ProductId, cancellationToken);

        if (hasAlreadyReviewed)
            throw new ConflictException("Bu ürüne zaten daha önce yorum yaptınız.");

        var review = new Review
        {
            UserId = request.UserId,
            ProductId = request.ProductId,
            Rating = request.Rating,
            Comment = request.Comment,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(review.Id, "Yorumunuz başarıyla eklendi.");
    }
}
