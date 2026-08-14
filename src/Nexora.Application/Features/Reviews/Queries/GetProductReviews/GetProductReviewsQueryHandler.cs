using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Reviews.Dtos;

namespace Nexora.Application.Features.Reviews.Queries.GetProductReviews;

public sealed class GetProductReviewsQueryHandler : IRequestHandler<GetProductReviewsQuery, Result<PagedResult<ReviewDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetProductReviewsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PagedResult<ReviewDto>>> Handle(GetProductReviewsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Reviews
            .AsNoTracking()
            .Where(r => r.ProductId == request.ProductId)
            .OrderByDescending(r => r.CreatedAtUtc);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new ReviewDto(
                r.Id,
                r.ProductId,
                r.UserId,
                $"{r.User.FirstName} {r.User.LastName}",
                r.Rating,
                r.Comment,
                r.CreatedAtUtc
            ))
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedResult<ReviewDto>(items, request.Page, request.PageSize, totalCount);

        return Result<PagedResult<ReviewDto>>.Success(pagedResult);
    }
}
