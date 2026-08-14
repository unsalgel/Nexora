using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Reviews.Commands.CreateReview;
using Nexora.Application.Features.Reviews.Dtos;
using Nexora.Application.Features.Reviews.Queries.GetProductReviews;

namespace Nexora.Api.Controllers;

public sealed class ReviewsController : ApiControllerBase
{
    [HttpGet("product/{productId:guid}")]
    public async Task<ActionResult<Result<PagedResult<ReviewDto>>>> GetProductReviews(
        Guid productId,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetProductReviewsQuery(productId, page, pageSize);
        var result = await Sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<Result<Guid>>> CreateReview(
        CreateReviewCommand command,
        CancellationToken cancellationToken = default)
    {
        var safeCommand = command with { UserId = GetCurrentUserId() };
        var result = await Sender.Send(safeCommand, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }
}
