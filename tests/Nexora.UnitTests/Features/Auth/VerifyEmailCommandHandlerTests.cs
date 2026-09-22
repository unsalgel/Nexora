using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Auth.Commands.VerifyEmail;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Auth;

public sealed class VerifyEmailCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<ILogger<VerifyEmailCommandHandler>> _loggerMock;
    private readonly VerifyEmailCommandHandler _handler;

    public VerifyEmailCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
        _emailServiceMock = new Mock<IEmailService>();
        _loggerMock = new Mock<ILogger<VerifyEmailCommandHandler>>();

        _handler = new VerifyEmailCommandHandler(_context, _emailServiceMock.Object, _loggerMock.Object);
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task Handle_WhenUserNotFound_ThrowsNotFoundException()
    {
        var command = new VerifyEmailCommand("olmayan@nexora.com", "123456");

        var act = async () => await _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("Kullanıcı bulunamadı.");
    }

    [Fact]
    public async Task Handle_WhenCodeIsInvalid_ThrowsBadRequestException()
    {
        var user = new User
        {
            FirstName = "Deniz",
            LastName = "Yıldız",
            Email = "deniz@nexora.com",
            PasswordHash = "hash",
            IsEmailConfirmed = false
        };
        _context.Users.Add(user);

        var code = new EmailVerificationCode
        {
            UserId = user.Id,
            Code = "654321",
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10),
            IsUsed = false
        };
        _context.EmailVerificationCodes.Add(code);
        await _context.SaveChangesAsync();

        var command = new VerifyEmailCommand(user.Email, "999999"); // Hatalı kod

        var act = async () => await _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<BusinessValidationException>()
            .WithMessage("Girdiğiniz doğrulama kodu hatalı.");
    }

    [Fact]
    public async Task Handle_WhenCodeExpired_ThrowsBadRequestException()
    {
        var user = new User
        {
            FirstName = "Kaan",
            LastName = "Demir",
            Email = "kaan@nexora.com",
            PasswordHash = "hash",
            IsEmailConfirmed = false
        };
        _context.Users.Add(user);

        var code = new EmailVerificationCode
        {
            UserId = user.Id,
            Code = "112233",
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(-5), // Süresi geçmiş
            IsUsed = false
        };
        _context.EmailVerificationCodes.Add(code);
        await _context.SaveChangesAsync();

        var command = new VerifyEmailCommand(user.Email, "112233");

        var act = async () => await _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<BusinessValidationException>()
            .WithMessage("Doğrulama kodunun süresi dolmuş. Lütfen yeni bir kod talep ediniz.");
    }

    [Fact]
    public async Task Handle_WhenCodeIsValid_ConfirmsEmailSuccessfully()
    {
        var user = new User
        {
            FirstName = "Zeynep",
            LastName = "Çelik",
            Email = "zeynep@nexora.com",
            PasswordHash = "hash",
            IsEmailConfirmed = false
        };
        _context.Users.Add(user);

        var code = new EmailVerificationCode
        {
            UserId = user.Id,
            Code = "123456",
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10),
            IsUsed = false
        };
        _context.EmailVerificationCodes.Add(code);
        await _context.SaveChangesAsync();

        var command = new VerifyEmailCommand(user.Email, "123456");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().Contain("E-posta adresiniz başarıyla doğrulandı");
        user.IsEmailConfirmed.Should().BeTrue();
        code.IsUsed.Should().BeTrue();
    }
}
