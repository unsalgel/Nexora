using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Features.Users.Commands.UpdateProfile;
using Nexora.Domain.Entities;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Users;

public sealed class UpdateProfileCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;
    private readonly UpdateProfileCommandHandler _handler;

    public UpdateProfileCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
        _handler = new UpdateProfileCommandHandler(_context);
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task Handle_WhenUserDoesNotExist_ReturnsFailure()
    {
        // Arrange
        var command = new UpdateProfileCommand(
            Guid.NewGuid(),
            "Ünsal",
            "Gel",
            "unsal@nexora.com");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Be("Kullanıcı bulunamadı.");
    }

    [Fact]
    public async Task Handle_WhenEmailIsTakenByAnotherUser_ReturnsFailure()
    {
        // Arrange
        var user1 = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Ünsal",
            LastName = "Gel",
            Email = "unsal@nexora.com",
            PasswordHash = "hash1",
            IsActive = true
        };

        var user2 = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Ali",
            LastName = "Veli",
            Email = "ali@nexora.com",
            PasswordHash = "hash2",
            IsActive = true
        };

        _context.Users.AddRange(user1, user2);
        await _context.SaveChangesAsync();

        var command = new UpdateProfileCommand(
            user1.Id,
            "Ünsal",
            "Gel",
            "ali@nexora.com");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Be("Bu e-posta adresi başka bir kullanıcı tarafından kullanılmaktadır.");
    }

    [Fact]
    public async Task Handle_WhenValidProfileUpdate_ReturnsSuccessAndUpdatesDatabase()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "EskiAd",
            LastName = "EskiSoyad",
            Email = "eski@nexora.com",
            PasswordHash = "hash",
            IsActive = true,
            IsEmailConfirmed = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var command = new UpdateProfileCommand(
            user.Id,
            "YeniAd",
            "YeniSoyad",
            "yeni@nexora.com");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.FirstName.Should().Be("YeniAd");
        result.Data.LastName.Should().Be("YeniSoyad");
        result.Data.Email.Should().Be("yeni@nexora.com");
        result.Data.IsEmailConfirmed.Should().BeFalse();

        var updatedInDb = await _context.Users.FirstAsync(u => u.Id == user.Id);
        updatedInDb.FirstName.Should().Be("YeniAd");
        updatedInDb.LastName.Should().Be("YeniSoyad");
        updatedInDb.Email.Should().Be("yeni@nexora.com");
        updatedInDb.IsEmailConfirmed.Should().BeFalse();
    }
}
