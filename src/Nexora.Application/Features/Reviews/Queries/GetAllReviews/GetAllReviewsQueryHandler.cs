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

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var search = request.SearchTerm.Trim().ToLower();
            query = query.Where(r => 
                r.Product.Name.ToLower().Contains(search.ToLower()) ||
                (r.User.FirstName + " " + r.User.LastName).ToLower().Contains(search.ToLower()) ||
                r.User.Email.ToLower().Contains(search.ToLower()) ||
                (r.Comment != null && r.Comment.ToLower().Contains(search.ToLower())));
        }

        if (request.Rating.HasValue && request.Rating.Value > 0)
        {
            query = query.Where(r => r.Rating == request.Rating.Value);
        }

        var page = request.Page;
        var pageSize = request.PageSize;
        var offset = Pagination.Offset(page, pageSize);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(r => r.CreatedAtUtc)
            .ThenBy(r => r.Id)
            .Skip(offset)
            .Take(pageSize)
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

        var pagedResult = new PagedResult<AdminReviewDto>(items, page, pageSize, totalCount);

        return Result<PagedResult<AdminReviewDto>>.Success(pagedResult);
    }
}
