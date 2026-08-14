using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Reviews.Commands.CreateReview;

public sealed record CreateReviewCommand(
    Guid UserId,
    Guid ProductId,
    int Rating,
    string? Comment) : IRequest<Result<Guid>>;
