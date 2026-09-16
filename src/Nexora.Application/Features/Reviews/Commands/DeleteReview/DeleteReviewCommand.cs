using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Reviews.Commands.DeleteReview;

public sealed record DeleteReviewCommand(Guid Id) : IRequest<Result<bool>>;
