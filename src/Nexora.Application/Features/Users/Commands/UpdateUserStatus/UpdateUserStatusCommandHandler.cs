using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Users.Commands.UpdateUserStatus;

public sealed class UpdateUserStatusCommandHandler : IRequestHandler<UpdateUserStatusCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public UpdateUserStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(UpdateUserStatusCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Kullanıcı bulunamadı.");

        user.IsActive = request.IsActive;

        if (!request.IsActive)
        {
            var userTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == user.Id && !rt.IsRevoked)
                .ToListAsync(cancellationToken);

            foreach (var token in userTokens)
            {
                token.IsRevoked = true;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true, request.IsActive ? "Kullanıcı hesabı aktif duruma getirildi." : "Kullanıcı hesabı donduruldu/pasife alındı.");
    }
}
