using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Reviews.Commands.DeleteReview;

public sealed class DeleteReviewCommandHandler : IRequestHandler<DeleteReviewCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public DeleteReviewCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(DeleteReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await _context.Reviews
            .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken);

        if (review is null)
        {
            return Result<bool>.Failure("Yorum bulunamadı.");
        }

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
