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

    public LoginCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtProvider jwtProvider,
        ILoginAttemptService loginAttemptService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtProvider = jwtProvider;
        _loginAttemptService = loginAttemptService;
    }

    public async Task<Result<AuthTokenDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        await _loginAttemptService.CheckAttemptAsync(request.Email, cancellationToken);

        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken)
            ?? throw new UnauthorizedException("E-posta adresi veya şifre hatalı.");

        if (!user.IsActive)
            throw new UnauthorizedException("Hesabınız aktif değildir. Lütfen destek ekibiyle iletişime geçiniz.");

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            await _loginAttemptService.RecordFailedAttemptAsync(request.Email, request.IpAddress, cancellationToken);
            throw new UnauthorizedException("E-posta adresi veya şifre hatalı.");
        }

        var failedAttemptsList = await _loginAttemptService.ResetAndGetAttemptsAsync(request.Email, cancellationToken) 
            ?? new List<FailedLoginAttemptDto>();

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var accessToken = _jwtProvider.GenerateAccessToken(user, roles);
        var refreshTokenValue = _jwtProvider.GenerateRefreshToken();

        var refreshToken = new DomainEntities.RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync(cancellationToken);

        var tokenDto = new AuthTokenDto(
            accessToken,
            refreshTokenValue,
            refreshToken.ExpiresAtUtc,
            failedAttemptsList.Count,
            failedAttemptsList);

        return Result<AuthTokenDto>.Success(tokenDto, "Giriş başarılı.");
    }
}
