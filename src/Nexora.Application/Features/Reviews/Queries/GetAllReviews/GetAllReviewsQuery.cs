using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Reviews.Dtos;

namespace Nexora.Application.Features.Reviews.Queries.GetAllReviews;

public sealed record GetAllReviewsQuery(
    string? SearchTerm = null,
    int? Rating = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<AdminReviewDto>>>;
