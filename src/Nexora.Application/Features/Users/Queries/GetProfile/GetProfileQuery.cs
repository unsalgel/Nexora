using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Users.Dtos;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Users.Queries.GetProfile;

public sealed record GetProfileQuery(Guid UserId) : IRequest<Result<UserProfileDto>>;

public sealed class GetProfileQueryHandler : IRequestHandler<GetProfileQuery, Result<UserProfileDto>>
{
    private readonly IApplicationDbContext _context;

    public GetProfileQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<UserProfileDto>> Handle(GetProfileQuery request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user is null)
        {
            throw new NotFoundException("Kullanıcı bulunamadı.");
        }

        var dto = new UserProfileDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            user.IsEmailConfirmed,
            user.PendingEmail);

        return Result<UserProfileDto>.Success(dto);
    }
}
