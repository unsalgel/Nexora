using System.Security.Cryptography;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Common.Extensions;
using Nexora.Application.Features.Users.Dtos;
using Nexora.Domain.Entities;

namespace Nexora.Application.Features.Users.Commands.UpdateProfile;

public sealed record UpdateProfileCommand(
    Guid UserId,
    string FirstName,
    string LastName,
    string Email) : IRequest<Result<UserProfileDto>>;

public sealed class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, Result<UserProfileDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService? _emailService;
    private readonly ILogger<UpdateProfileCommandHandler>? _logger;

    public UpdateProfileCommandHandler(
        IApplicationDbContext context,
        IEmailService? emailService = null,
        ILogger<UpdateProfileCommandHandler>? logger = null)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
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
        var emailChanged = false;
        var verificationCode = string.Empty;

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
            emailChanged = true;

            verificationCode = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
            var emailVerification = new EmailVerificationCode
            {
                UserId = user.Id,
                Code = verificationCode,
                ExpiresAtUtc = DateTime.UtcNow.AddMinutes(15),
                IsUsed = false
            };
            _context.EmailVerificationCodes.Add(emailVerification);

            var activeRefreshTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == user.Id && !rt.IsRevoked)
                .ToListAsync(cancellationToken);

            foreach (var token in activeRefreshTokens)
            {
                token.IsRevoked = true;
            }
        }

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();

        await _context.SaveChangesAsync(cancellationToken);

        if (emailChanged && _emailService != null && _logger != null)
        {
            var registeredUserName = $"{user.FirstName} {user.LastName}".Trim();
            _emailService.SendInBackground(
                svc => svc.SendEmailVerificationCodeEmailAsync(normalizedEmail, registeredUserName, verificationCode, CancellationToken.None),
                _logger,
                "E-posta doğrulama kodu gönderilemedi. UserId: {UserId}",
                user.Id);
        }

        var dto = new UserProfileDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            user.IsEmailConfirmed);

        return Result<UserProfileDto>.Success(dto);
    }
}
