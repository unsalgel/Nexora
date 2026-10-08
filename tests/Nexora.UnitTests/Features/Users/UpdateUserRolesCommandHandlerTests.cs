using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Users.Commands.UpdateUserRoles;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Users;

public sealed class UpdateUserRolesCommandHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;
    private readonly Mock<ITokenBlacklistService> _tokenBlacklistServiceMock;
    private readonly UpdateUserRolesCommandHandler _handler;

    public UpdateUserRolesCommandHandlerTests()
    {
        _context = TestDbContextFactory.Create();
        _tokenBlacklistServiceMock = new Mock<ITokenBlacklistService>();
        _handler = new UpdateUserRolesCommandHandler(_context, _tokenBlacklistServiceMock.Object);
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task Handle_WhenRemovingAdminRoleFromLastAdmin_ThrowsConflictException()
    {
        var adminRole = await _context.Roles.FirstAsync(r => r.Name == "Admin");

        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Admin",
            LastName = "User",
            Email = "admin@nexora.com",
            PasswordHash = "hash",
            IsActive = true
        };
        _context.Users.Add(adminUser);

        var userRole = new UserRole { UserId = adminUser.Id, RoleId = adminRole.Id, Role = adminRole, User = adminUser };
        _context.UserRoles.Add(userRole);
        await _context.SaveChangesAsync();

        var command = new UpdateUserRolesCommand(adminUser.Id, new List<string> { "Customer" });
        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("Sistemdeki son aktif yöneticinin yönetici yetkisi kaldırılamaz.");
    }

    [Fact]
    public async Task Handle_WhenMultipleAdminsExist_CanDemoteAdminSuccessfully()
    {
        var adminRole = await _context.Roles.FirstAsync(r => r.Name == "Admin");

        var admin1 = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Admin1",
            LastName = "User",
            Email = "admin1@nexora.com",
            PasswordHash = "hash",
            IsActive = true
        };
        var admin2 = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Admin2",
            LastName = "User",
            Email = "admin2@nexora.com",
            PasswordHash = "hash",
            IsActive = true
        };
        _context.Users.AddRange(admin1, admin2);

        _context.UserRoles.Add(new UserRole { UserId = admin1.Id, RoleId = adminRole.Id, Role = adminRole, User = admin1 });
        _context.UserRoles.Add(new UserRole { UserId = admin2.Id, RoleId = adminRole.Id, Role = adminRole, User = admin2 });
        await _context.SaveChangesAsync();

        var command = new UpdateUserRolesCommand(admin1.Id, new List<string> { "Customer" });
        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        var userRoles = await _context.UserRoles.Where(ur => ur.UserId == admin1.Id).Include(ur => ur.Role).ToListAsync();
        userRoles.Should().ContainSingle(ur => ur.Role.Name == "Customer");
        _tokenBlacklistServiceMock.Verify(x => x.RevokeUserAsync(admin1.Id, It.IsAny<CancellationToken>()), Times.Once);
    }
}
