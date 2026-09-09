using FluentAssertions;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Auth.Commands.Login;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Auth;

public sealed class LoginCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<IJwtProvider> _jwtProviderMock;
    private readonly Mock<ILoginAttemptService> _loginAttemptServiceMock;
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _jwtProviderMock = new Mock<IJwtProvider>();
        _loginAttemptServiceMock = new Mock<ILoginAttemptService>();

        _handler = new LoginCommandHandler(
            _context,
            _passwordHasherMock.Object,
            _jwtProviderMock.Object,
            _loginAttemptServiceMock.Object);
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task Handle_ValidCredentials_ReturnsAccessTokenAndRefreshToken()
    {
        // Arrange
        var role = new Role { Id = Guid.NewGuid(), Name = "Customer" };
        _context.Roles.Add(role);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@nexora.com",
            PasswordHash = "hashed_pw",
            FirstName = "Ali",
            LastName = "Yılmaz",
            IsActive = true
        };
        _context.Users.Add(user);

        var userRole = new UserRole { UserId = user.Id, RoleId = role.Id, Role = role, User = user };
        _context.UserRoles.Add(userRole);
        await _context.SaveChangesAsync();

        _passwordHasherMock.Setup(x => x.Verify("Password123!", "hashed_pw")).Returns(true);
        _jwtProviderMock.Setup(x => x.GenerateAccessToken(It.IsAny<User>(), It.IsAny<IList<string>>())).Returns("access_token_123");
        _jwtProviderMock.Setup(x => x.GenerateRefreshToken()).Returns("refresh_token_456");

        var command = new LoginCommand("test@nexora.com", "Password123!");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.AccessToken.Should().Be("access_token_123");
        result.Data.RefreshToken.Should().Be("refresh_token_456");
    }

    [Fact]
    public async Task Handle_InvalidPassword_ThrowsUnauthorizedException()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@nexora.com",
            PasswordHash = "hashed_pw",
            FirstName = "Ali",
            LastName = "Yılmaz",
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _passwordHasherMock.Setup(x => x.Verify("WrongPassword", "hashed_pw")).Returns(false);

        var command = new LoginCommand("test@nexora.com", "WrongPassword");

        // Act
        var act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("E-posta adresi veya şifre hatalı.");
    }

    [Fact]
    public async Task Handle_UserNotFound_ThrowsUnauthorizedException()
    {
        // Arrange
        var command = new LoginCommand("nonexistent@nexora.com", "Password123!");

        // Act
        var act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("E-posta adresi veya şifre hatalı.");
    }

    [Fact]
    public async Task Handle_InactiveUser_ThrowsUnauthorizedException()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "inactive@nexora.com",
            PasswordHash = "hashed_pw",
            FirstName = "Ali",
            LastName = "Yılmaz",
            IsActive = false
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var command = new LoginCommand("inactive@nexora.com", "Password123!");

        // Act
        var act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("Hesabınız aktif değildir. Lütfen destek ekibiyle iletişime geçiniz.");
    }
}
