using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Users.Dtos;

namespace Nexora.Application.Features.Users.Commands.UpdateProfile;

public sealed record UpdateProfileCommand(
    Guid UserId,
    string FirstName,
    string LastName,
    string Email) : IRequest<Result<UserProfileDto>>;

public sealed class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, Result<UserProfileDto>>
{
    private readonly IApplicationDbContext _context;

    public UpdateProfileCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<UserProfileDto>> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user is null)
        {
            return Result<UserProfileDto>.Failure("Kullanıcı bulunamadı.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        if (!string.Equals(user.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase))
        {
            var isEmailTaken = await _context.Users
                .AnyAsync(u => u.Email == normalizedEmail && u.Id != request.UserId, cancellationToken);

            if (isEmailTaken)
            {
                return Result<UserProfileDto>.Failure("Bu e-posta adresi başka bir kullanıcı tarafından kullanılmaktadır.");
            }

            user.Email = normalizedEmail;
            user.IsEmailConfirmed = false;
        }

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();

        await _context.SaveChangesAsync(cancellationToken);

        var dto = new UserProfileDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            user.IsEmailConfirmed);

        return Result<UserProfileDto>.Success(dto);
    }
}
