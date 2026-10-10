using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Reviews.Queries.GetProductReviewSummary;

public sealed record ProductReviewSummaryDto(double AverageRating, int TotalCount);
public sealed record GetProductReviewSummaryQuery(Guid ProductId) : IRequest<Result<ProductReviewSummaryDto>>;

public sealed class GetProductReviewSummaryQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetProductReviewSummaryQuery, Result<ProductReviewSummaryDto>>
{
    public async Task<Result<ProductReviewSummaryDto>> Handle(GetProductReviewSummaryQuery request, CancellationToken cancellationToken)
    {
        var summary = await context.Reviews.AsNoTracking().Where(r => r.ProductId == request.ProductId)
            .GroupBy(r => r.ProductId)
            .Select(g => new ProductReviewSummaryDto(g.Average(r => (double)r.Rating), g.Count()))
            .FirstOrDefaultAsync(cancellationToken);
        return Result<ProductReviewSummaryDto>.Success(summary ?? new ProductReviewSummaryDto(0, 0));
    }
}
