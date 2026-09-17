using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Auth.Commands.Register;

public sealed class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;

    public RegisterCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IEmailService emailService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
    }

    public async Task<Result<string>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var existingUser = await _context.Users
            .AnyAsync(u => u.Email == request.Email, cancellationToken);

        if (existingUser)
            throw new ConflictException("Bu e-posta adresi ile zaten kayıtlı bir kullanıcı bulunmaktadır.");

        var customerRole = await _context.Roles
            .FirstOrDefaultAsync(r => r.Name == "Customer", cancellationToken)
            ?? throw new NotFoundException("Varsayılan kullanıcı rolü bulunamadı.");

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            IsActive = true
        };

        user.UserRoles.Add(new UserRole
        {
            User = user,
            Role = customerRole
        });

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        var registeredUserName = $"{user.FirstName} {user.LastName}".Trim();
        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendWelcomeEmailAsync(user.Email, registeredUserName, CancellationToken.None);
            }
            catch
            {
            }
        });

        return Result<string>.Success("Kayıt başarıyla tamamlandı.");
    }
}
