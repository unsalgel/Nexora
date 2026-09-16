using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Reviews.Dtos;

namespace Nexora.Application.Features.Reviews.Queries.GetAllReviews;

public sealed class GetAllReviewsQueryHandler : IRequestHandler<GetAllReviewsQuery, Result<PagedResult<AdminReviewDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetAllReviewsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PagedResult<AdminReviewDto>>> Handle(GetAllReviewsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Reviews
            .AsNoTracking()
            .Include(r => r.Product)
            .Include(r => r.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(r => 
                r.Product.Name.ToLower().Contains(search) ||
                (r.User.FirstName + " " + r.User.LastName).ToLower().Contains(search) ||
                r.User.Email.ToLower().Contains(search) ||
                (r.Comment != null && r.Comment.ToLower().Contains(search)));
        }

        if (request.Rating.HasValue && request.Rating.Value > 0)
        {
            query = query.Where(r => r.Rating == request.Rating.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(r => r.CreatedAtUtc)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new AdminReviewDto(
                r.Id,
                r.ProductId,
                r.Product.Name,
                r.UserId,
                $"{r.User.FirstName} {r.User.LastName}",
                r.User.Email,
                r.Rating,
                r.Comment,
                r.CreatedAtUtc
            ))
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedResult<AdminReviewDto>(items, request.Page, request.PageSize, totalCount);

        return Result<PagedResult<AdminReviewDto>>.Success(pagedResult);
    }
}
