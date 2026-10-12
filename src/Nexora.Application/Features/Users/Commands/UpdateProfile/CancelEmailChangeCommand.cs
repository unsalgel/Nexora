using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Users.Commands.UpdateProfile;

public sealed record CancelEmailChangeCommand(Guid UserId) : IRequest<Result<bool>>;
public sealed class CancelEmailChangeCommandHandler(IApplicationDbContext context) : IRequestHandler<CancelEmailChangeCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(CancelEmailChangeCommand request, CancellationToken ct)
    {
        await using var transaction = await context.BeginTransactionAsync($"auth:{request.UserId}", ct);
        var user = await context.Users.SingleOrDefaultAsync(u => u.Id == request.UserId, ct) ?? throw new NotFoundException("Kullanıcı bulunamadı.");
        var codes = await context.EmailVerificationCodes.Where(c => c.UserId == user.Id && c.TargetEmail == user.PendingEmail && !c.IsUsed).ToListAsync(ct);
        foreach (var code in codes) code.IsUsed = true;
        user.PendingEmail = null;
        user.PendingEmailExpiresAtUtc = null;
        await context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return Result<bool>.Success(true, "E-posta değişikliği iptal edildi.");
    }
}
