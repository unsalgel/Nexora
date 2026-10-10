using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Notifications.Queries.GetUnreadNotificationCount;

public sealed record GetUnreadNotificationCountQuery(Guid UserId) : IRequest<Result<int>>;

public sealed class GetUnreadNotificationCountQueryHandler(IApplicationDbContext context) : IRequestHandler<GetUnreadNotificationCountQuery, Result<int>>
{
    public async Task<Result<int>> Handle(GetUnreadNotificationCountQuery request, CancellationToken cancellationToken)
    {
        return Result<int>.Success(await context.Notifications.AsNoTracking()
            .CountAsync(n => n.UserId == request.UserId && !n.IsRead, cancellationToken));
    }
}
