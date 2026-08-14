using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Reviews.Dtos;

namespace Nexora.Application.Features.Reviews.Queries.GetProductReviews;

public sealed record GetProductReviewsQuery(
    Guid ProductId,
    int Page = 1,
    int PageSize = 20) : IRequest<Result<PagedResult<ReviewDto>>>;
