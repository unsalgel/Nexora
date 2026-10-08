using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Auth.Commands.ResendVerificationCode;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Auth;

public sealed class ResendVerificationCodeCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<ILogger<ResendVerificationCodeCommandHandler>> _loggerMock;
    private readonly ResendVerificationCodeCommandHandler _handler;

    public ResendVerificationCodeCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
        _emailServiceMock = new Mock<IEmailService>();
        _loggerMock = new Mock<ILogger<ResendVerificationCodeCommandHandler>>();

        _handler = new ResendVerificationCodeCommandHandler(_context, _emailServiceMock.Object, _loggerMock.Object);
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task Handle_WhenUserNotFound_ReturnsGenericSuccessMessage()
    {
        var command = new ResendVerificationCodeCommand("olmayan@nexora.com");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().Contain("Eğer e-posta adresi sistemimizde kayıtlıysa");
    }

    [Fact]
    public async Task Handle_WhenEmailAlreadyConfirmed_ReturnsAlreadyConfirmedMessage()
    {
        var user = new User
        {
            FirstName = "Ali",
            LastName = "Veli",
            Email = "ali@nexora.com",
            PasswordHash = "hash",
            IsEmailConfirmed = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var command = new ResendVerificationCodeCommand("ali@nexora.com");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().Contain("zaten doğrulanmış");
    }

    [Fact]
    public async Task Handle_WhenValid_GeneratesNewCodeAndDispatchesEmail()
    {
        var user = new User
        {
            FirstName = "Can",
            LastName = "Demir",
            Email = "can@nexora.com",
            PasswordHash = "hash",
            IsEmailConfirmed = false
        };
        _context.Users.Add(user);

        var existingCode = new EmailVerificationCode
        {
            UserId = user.Id,
            Code = "111111",
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10),
            IsUsed = false
        };
        _context.EmailVerificationCodes.Add(existingCode);
        await _context.SaveChangesAsync();

        var command = new ResendVerificationCodeCommand("can@nexora.com");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();

        var updatedExistingCode = await _context.EmailVerificationCodes.FirstOrDefaultAsync(c => c.Id == existingCode.Id);
        updatedExistingCode!.IsUsed.Should().BeTrue();

        var newCodes = await _context.EmailVerificationCodes
            .Where(c => c.UserId == user.Id && !c.IsUsed)
            .ToListAsync();

        newCodes.Should().HaveCount(1);
        newCodes[0].Code.Should().HaveLength(6);
    }
}
