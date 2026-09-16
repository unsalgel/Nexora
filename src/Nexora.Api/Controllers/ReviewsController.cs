using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Reviews.Commands.CreateReview;
using Nexora.Application.Features.Reviews.Commands.DeleteReview;
using Nexora.Application.Features.Reviews.Dtos;
using Nexora.Application.Features.Reviews.Queries.GetAllReviews;
using Nexora.Application.Features.Reviews.Queries.GetProductReviews;

namespace Nexora.Api.Controllers;

public sealed class ReviewsController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<PagedResult<AdminReviewDto>>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] int? rating,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAllReviewsQuery(search, rating, page, pageSize);
        var result = await Sender.Send(query, cancellationToken);
        return Ok(result);
    }

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

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<bool>>> DeleteReview(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new DeleteReviewCommand(id), cancellationToken);
        return Ok(result);
    }
}
