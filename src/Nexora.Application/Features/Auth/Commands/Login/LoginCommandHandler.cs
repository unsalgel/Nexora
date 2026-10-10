using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Auth.Dtos;
using DomainEntities = Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Auth.Commands.Login;

public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthTokenDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtProvider _jwtProvider;
    private readonly ILoginAttemptService _loginAttemptService;
    private readonly IAuthTokenProtector _protector;

    public LoginCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtProvider jwtProvider,
        ILoginAttemptService loginAttemptService,
        IAuthTokenProtector protector)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtProvider = jwtProvider;
        _loginAttemptService = loginAttemptService;
        _protector = protector;
    }

    private const string DummyPasswordHash = "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    public async Task<Result<AuthTokenDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var userId = await _context.Users.AsNoTracking().Where(u => u.Email == normalizedEmail)
            .Select(u => (Guid?)u.Id).FirstOrDefaultAsync(cancellationToken);
        await using var transaction = await _context.BeginTransactionAsync($"auth:{userId?.ToString() ?? normalizedEmail}", cancellationToken);
        await _loginAttemptService.CheckAttemptAsync(request.Email, cancellationToken);
        var user = userId.HasValue ? await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId && u.Email == normalizedEmail, cancellationToken) : null;

        if (user is null)
        {
            _passwordHasher.Verify(request.Password, DummyPasswordHash);
            await _loginAttemptService.RecordFailedAttemptAsync(request.Email, request.IpAddress, cancellationToken);
            throw new UnauthorizedException("E-posta adresi veya şifre hatalı.");
        }

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            await _loginAttemptService.RecordFailedAttemptAsync(request.Email, request.IpAddress, cancellationToken);
            throw new UnauthorizedException("E-posta adresi veya şifre hatalı.");
        }

        if (!user.IsActive)
            throw new UnauthorizedException("Hesabınız aktif değildir. Lütfen destek ekibiyle iletişime geçiniz.");

        if (!user.IsEmailConfirmed)
            throw new UnauthorizedException("Giriş yapabilmek için lütfen önce e-posta adresinizi doğrulayın.");

        var failedAttemptsList = await _loginAttemptService.ResetAndGetAttemptsAsync(request.Email, cancellationToken) 
            ?? new List<FailedLoginAttemptDto>();

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var sessionId = Guid.NewGuid();
        var accessToken = _jwtProvider.GenerateAccessToken(user, roles, sessionId);
        var refreshTokenValue = _jwtProvider.GenerateRefreshToken();
        var expirationDays = _jwtProvider.GetRefreshTokenExpirationDays();
        if (expirationDays <= 0) expirationDays = 7;

        var refreshToken = new DomainEntities.RefreshToken
        {
            UserId = user.Id,
            Token = _protector.HashRefreshToken(refreshTokenValue),
            SessionId = sessionId,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(expirationDays),
            IsRevoked = false
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var tokenDto = new AuthTokenDto(
            accessToken,
            refreshTokenValue,
            refreshToken.ExpiresAtUtc,
            failedAttemptsList.Count,
            failedAttemptsList);

        return Result<AuthTokenDto>.Success(tokenDto, "Giriş başarılı.");
    }
}
