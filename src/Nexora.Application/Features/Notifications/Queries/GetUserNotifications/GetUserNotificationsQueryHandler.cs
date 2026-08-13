using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Notifications.Dtos;

namespace Nexora.Application.Features.Notifications.Queries.GetUserNotifications;

public sealed class GetUserNotificationsQueryHandler : IRequestHandler<GetUserNotificationsQuery, Result<PagedResult<NotificationDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetUserNotificationsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PagedResult<NotificationDto>>> Handle(GetUserNotificationsQuery request, CancellationToken cancellationToken)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? 20 : (request.PageSize > 100 ? 100 : request.PageSize);

        var query = _context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == request.UserId);

        if (request.OnlyUnread.HasValue && request.OnlyUnread.Value)
        {
            query = query.Where(n => !n.IsRead);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var notifications = await query
            .OrderByDescending(n => n.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationDto(
                n.Id,
                n.UserId,
                n.Title,
                n.Message,
                n.Type.ToString(),
                n.IsRead,
                n.ReadAtUtc,
                n.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedResult<NotificationDto>(notifications, page, pageSize, totalCount);

        return Result<PagedResult<NotificationDto>>.Success(pagedResult);
    }
}
