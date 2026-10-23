using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Nexora.Api.Middlewares;
using Nexora.Api.Services;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Auth.Commands.Register;
using Nexora.Application.Features.Auth.Dtos;
using Nexora.Application.Features.ProductAttributes;
using Nexora.Application.Features.Products.Queries.GetProductById;
using Nexora.Application.Features.Users.Commands.UpdateProfile;
using Nexora.Application.Features.Users.Commands.UpdateUserRoles;
using Nexora.Application.Features.Users.Commands.UpdateUserStatus;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;
using Nexora.Infrastructure.Authentication;
using Nexora.Infrastructure.BackgroundJobs;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;
using Nexora.Application.Features.Orders.Commands.CreateOrder;
using Nexora.Application.Features.Orders.Dtos;
using Nexora.Application.Features.Categories.Commands.DeleteCategory;
using Nexora.Application.Features.Brands.Commands.DeleteBrand;
using Nexora.Domain.Enums;

namespace Nexora.UnitTests.Features;

public sealed class ReviewRegressionTests
{
    [Theory]
    [InlineData("ascii", 72, true)]
    [InlineData("ascii", 73, false)]
    [InlineData("turkish", 36, true)]
    [InlineData("turkish", 37, false)]
    [InlineData("emoji", 18, true)]
    [InlineData("emoji", 19, false)]
    public void PasswordPolicy_EnforcesUtf8Bytes(string kind, int count, bool expected)
    {
        var unit = kind == "ascii" ? "A" : kind == "turkish" ? "ü" : "😀";
        PasswordPolicy.FitsBcrypt(string.Concat(Enumerable.Repeat(unit, count))).Should().Be(expected);
    }

    [Fact]
    public void LongUnicodePasswords_CannotBeCreatedOrAuthenticateByTruncation()
    {
        var password = "Aa1" + new string('ü', 35) + "X";
        new RegisterCommandValidator().Validate(new RegisterCommand("Ali", "Veli", "a@example.test", password)).IsValid.Should().BeFalse();
        var hasher = new PasswordHasher();
        Assert.Throws<BusinessValidationException>(() => hasher.Hash(password));
        var legacy = BCrypt.Net.BCrypt.HashPassword(password);
        hasher.Verify(password[..^1] + "Y", legacy).Should().BeFalse();
        var valid = "Aa1" + new string('ü', 34) + "X";
        hasher.Verify(valid, hasher.Hash(valid)).Should().BeTrue();
    }

    [Theory]
    [InlineData(0, 20)]
    [InlineData(-1, 20)]
    [InlineData(int.MaxValue, 20)]
    [InlineData(1, 101)]
    [InlineData(1, 0)]
    public void Pagination_RejectsInvalidOrExcessiveOffsets(int page, int size) =>
        Assert.Throws<BusinessValidationException>(() => Pagination.Offset(page, size));

    [Fact] public void Pagination_PreservesOrdinaryPages() => Pagination.Offset(3, 20).Should().Be(40);

    private static User User(string email, bool confirmed = true) => new()
    { FirstName = "Ali", LastName = "Veli", Email = email, PasswordHash = "hash", IsActive = true, IsEmailConfirmed = confirmed };

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task UnconfirmedAdmin_CannotSatisfyLastAdminProtection(bool changeRole)
    {
        using var db = TestDbContextFactory.Create();
        var admin = await db.Roles.SingleAsync(r => r.Name == "Admin");
        var usable = User("usable@example.test"); var unconfirmed = User("pending@example.test", false);
        db.Users.AddRange(usable, unconfirmed);
        db.UserRoles.AddRange(new UserRole { User = usable, Role = admin }, new UserRole { User = unconfirmed, Role = admin });
        await db.SaveChangesAsync();
        if (changeRole) await Assert.ThrowsAsync<ConflictException>(() => new UpdateUserRolesCommandHandler(db).Handle(new(usable.Id, ["Customer"]), default));
        else await Assert.ThrowsAsync<ConflictException>(() => new UpdateUserStatusCommandHandler(db).Handle(new(usable.Id, false), default));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task PendingEmail_ExpiredOrCancelled_DoesNotBlockRegistration(bool cancel)
    {
        using var db = TestDbContextFactory.Create();
        var user = User("old@example.test"); user.PendingEmail = "free@example.test";
        user.PendingEmailExpiresAtUtc = DateTime.UtcNow.AddMinutes(cancel ? 15 : -1);
        db.Users.Add(user); await db.SaveChangesAsync();
        if (cancel) await new CancelEmailChangeCommandHandler(db).Handle(new(user.Id), default);
        var hasher = Mock.Of<IPasswordHasher>(h => h.Hash(It.IsAny<string>()) == "new-hash");
        var handler = new RegisterCommandHandler(db, hasher, Mock.Of<IEmailService>(), TestSecurity.Protector);
        (await handler.Handle(new("New", "User", "free@example.test", "Password123"), default)).IsSuccess.Should().BeTrue();
        await new AuthCleanupJob(db).RunAsync();
        user.PendingEmail.Should().BeNull();
    }

    [Fact]
    public async Task Cleanup_PreservesFreshPendingRequest()
    {
        using var db = TestDbContextFactory.Create();
        var user = User("old@example.test"); user.PendingEmail = "new@example.test";
        user.PendingEmailExpiresAtUtc = DateTime.UtcNow.AddMinutes(15);
        db.Users.Add(user); await db.SaveChangesAsync();
        await new AuthCleanupJob(db).RunAsync();
        user.PendingEmail.Should().Be("new@example.test");
    }

    [Fact]
    public async Task InactiveProduct_IsHiddenFromPublicButEditableByAdmin()
    {
        using var db = TestDbContextFactory.Create();
        var product = new Product { Name = "Draft", SKU = "draft", Description = "draft", Price = 10, IsActive = false,
            Category = new Category { Name = "Category" }, Brand = new Brand { Name = "Brand" } };
        db.Products.Add(product); await db.SaveChangesAsync();
        var handler = new GetProductByIdQueryHandler(db);
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new(product.Id), default));
        (await handler.Handle(new(product.Id, true), default)).Data!.IsActive.Should().BeFalse();
    }

    [Theory]
    [InlineData(false, 503)]
    [InlineData(true, 499)]
    public async Task Cancellation_DoesNotReturnEmptySuccess(bool clientCancelled, int expected)
    {
        var context = new DefaultHttpContext(); context.Response.Body = new MemoryStream();
        if (clientCancelled) context.RequestAborted = new CancellationToken(true);
        var middleware = new GlobalExceptionHandlerMiddleware(_ => throw new OperationCanceledException(), NullLogger<GlobalExceptionHandlerMiddleware>.Instance);
        await middleware.InvokeAsync(context, Mock.Of<IDbLogger>());
        context.Response.StatusCode.Should().Be(expected);
        if (!clientCancelled) context.Response.Body.Length.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task StartedResponse_IsAbortedInsteadOfOverwritten()
    {
        var response = new Mock<Microsoft.AspNetCore.Http.Features.IHttpResponseFeature>();
        response.SetupGet(r => r.HasStarted).Returns(true);
        var lifetime = new Mock<Microsoft.AspNetCore.Http.Features.IHttpRequestLifetimeFeature>();
        var context = new DefaultHttpContext();
        context.Features.Set(response.Object); context.Features.Set(lifetime.Object);
        var middleware = new GlobalExceptionHandlerMiddleware(_ => throw new TimeoutException(), NullLogger<GlobalExceptionHandlerMiddleware>.Instance);
        await middleware.InvokeAsync(context, Mock.Of<IDbLogger>());
        lifetime.Verify(x => x.Abort(), Times.Once);
    }

    [Fact]
    public async Task Audit_IsTransactionalAndExcludesPasswordsAndContactSettings()
    {
        var actor = Mock.Of<IAuditContext>(a => a.ActorId == Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") && a.TraceId == "review-test");
        using var db = new NexoraDbContext(new DbContextOptionsBuilder<NexoraDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options, actor);
        var user = User("private@example.test"); user.PasswordHash = "never-log-this";
        db.Users.Add(user); await db.SaveChangesAsync();
        user.IsActive = false; await db.SaveChangesAsync();
        var audit = await db.AuditEntries.OrderByDescending(a => a.TimestampUtc).FirstAsync();
        audit.ActorId.Should().Be(actor.ActorId); audit.TraceId.Should().Be("review-test");
        audit.Changes.Should().Contain("IsActive").And.Contain("false").And.NotContain("never-log-this").And.NotContain("private@example.test");
        db.Settings.Add(new Setting { Key = "ContactEmail", Value = "private@example.test" }); await db.SaveChangesAsync();
        (await db.AuditEntries.Where(a => a.EntityType == "Setting").SingleAsync()).Changes.Should().NotContain("private@example.test");
    }

    [Fact]
    public async Task Retention_RemovesOnlyExpiredRecordsInBoundedBatches()
    {
        using var db = TestDbContextFactory.Create();
        db.Logs.AddRange(Enumerable.Range(0, 1005).Select(_ => new Log { Id = Guid.NewGuid(), Level = "Error", Message = "test", TimestampUtc = DateTime.UtcNow.AddDays(-31) }));
        db.Logs.Add(new Log { Id = Guid.NewGuid(), Level = "Information", Message = "recent", TimestampUtc = DateTime.UtcNow });
        db.AuditEntries.Add(new AuditEntry { TimestampUtc = DateTime.UtcNow.AddDays(-366) });
        await db.SaveChangesAsync(); await new LogRetentionJob(db).RunAsync();
        (await db.Logs.CountAsync()).Should().Be(6); (await db.AuditEntries.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task AttributeManagement_RejectsDuplicateNamesAndUsedValueDeletion()
    {
        using var db = TestDbContextFactory.Create(); var handler = new AttributeManagement(db);
        var attribute = (await handler.Handle(new SaveAttributeCommand(null, "Renk"), default)).Data;
        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(new SaveAttributeCommand(null, "renk"), default));
        var value = (await handler.Handle(new SaveAttributeValueCommand(attribute, null, "Mavi"), default)).Data;
        db.ProductVariantAttributeValues.Add(new ProductVariantAttributeValue { ProductVariantId = Guid.NewGuid(), ProductAttributeValueId = value }); await db.SaveChangesAsync();
        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(new DeleteAttributeValueCommand(value), default));
    }

    private static BrowserSession BrowserSession() => new(new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        { ["BrowserSessions:web:AllowedOrigins:0"] = "https://shop.example.test" }).Build(), Mock.Of<IWebHostEnvironment>(e => e.EnvironmentName == "Production"));

    [Fact]
    public void BrowserRefreshCookie_IsHttpOnlySecure_AndRemovedFromResponse()
    {
        var context = new DefaultHttpContext(); context.Request.Scheme = "https";
        context.Request.Headers["X-Nexora-Client"] = "web"; context.Request.Headers.Origin = "https://shop.example.test";
        var session = BrowserSession(); var client = session.Client(context.Request);
        var result = session.Write(context, client, Result<AuthTokenDto>.Success(new("access", "secret-refresh", DateTime.UtcNow.AddDays(1))));
        result.Data!.RefreshToken.Should().BeEmpty();
        context.Response.Headers.SetCookie.ToString().Should().Contain("httponly").And.Contain("secure").And.Contain("samesite=strict");
    }

    [Theory]
    [InlineData("https://evil.example.test")]
    [InlineData("")]
    public void BrowserRequests_RequireExplicitTrustedOrigin(string origin)
    {
        var context = new DefaultHttpContext(); context.Request.Scheme = "https";
        context.Request.Headers["X-Nexora-Client"] = "web"; context.Request.Headers.Origin = origin;
        Assert.Throws<UnauthorizedException>(() => BrowserSession().Client(context.Request));
    }

    [Fact]
    public void Order_CancelAndRestock_AtomicallyCancelsAndRestocksItems()
    {
        var product = new Product { Id = Guid.NewGuid(), Name = "P", Price = 100, StockQuantity = 5, IsActive = true };
        var variant = new ProductVariant { Id = Guid.NewGuid(), ProductId = product.Id, SKU = "V", Price = 100, StockQuantity = 2, IsActive = true };
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "NX-TEST-001",
            UserId = Guid.NewGuid(),
            ShippingAddress = "Test Address",
            TotalAmount = 300,
            Status = OrderStatus.Pending,
            PaymentStatus = PaymentStatus.Pending,
            Items = new List<OrderItem>
            {
                new() { Id = Guid.NewGuid(), Product = product, ProductId = product.Id, ProductName = "P", Quantity = 2, UnitPrice = 100, TotalPrice = 200 },
                new() { Id = Guid.NewGuid(), Product = product, ProductId = product.Id, ProductVariant = variant, ProductVariantId = variant.Id, ProductName = "P", Quantity = 1, UnitPrice = 100, TotalPrice = 100 }
            }
        };

        order.CancelAndRestock(PaymentStatus.Failed);

        order.Status.Should().Be(OrderStatus.Cancelled);
        order.PaymentStatus.Should().Be(PaymentStatus.Failed);
        product.StockQuantity.Should().Be(7);
        variant.StockQuantity.Should().Be(3);
    }

    [Fact]
    public async Task DeleteCategory_WithActiveProducts_ThrowsConflictException()
    {
        using var db = TestDbContextFactory.Create();
        var catId = Guid.NewGuid();
        db.Categories.Add(new Category { Id = catId, Name = "Cat" });
        db.Products.Add(new Product { Id = Guid.NewGuid(), CategoryId = catId, Name = "Prod", SKU = "P-CAT", Price = 10, StockQuantity = 5, IsActive = true, IsDeleted = false });
        await db.SaveChangesAsync();

        var handler = new DeleteCategoryCommandHandler(db);
        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(new DeleteCategoryCommand(catId), default));
    }

    [Fact]
    public async Task DeleteBrand_WithActiveProducts_ThrowsConflictException()
    {
        using var db = TestDbContextFactory.Create();
        var brandId = Guid.NewGuid();
        db.Brands.Add(new Brand { Id = brandId, Name = "Brand" });
        db.Products.Add(new Product { Id = Guid.NewGuid(), BrandId = brandId, Name = "Prod", SKU = "P-BRAND", Price = 10, StockQuantity = 5, IsActive = true, IsDeleted = false });
        await db.SaveChangesAsync();

        var handler = new DeleteBrandCommandHandler(db);
        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(new DeleteBrandCommand(brandId), default));
    }

    [Fact]
    public async Task CreateOrder_IdempotencyKey_RejectsDifferentRequestFromDatabase()
    {
        using var db = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        db.Orders.Add(new Order { UserId = userId, OrderNumber = "NX-EXISTING-001", ShippingAddress = "Address",
            IdempotencyKey = "idem-123", RequestHash = "DUMMYHASH" });
        await db.SaveChangesAsync();

        var handler = new CreateOrderCommandHandler(
            db,
            Mock.Of<IPaymentService>(),
            Mock.Of<IEmailService>(),
            Mock.Of<IRealTimeNotificationService>(),
            NullLogger<CreateOrderCommandHandler>.Instance);

        var command = new CreateOrderCommand(userId, "Address", new PaymentRequestDto("1234567890123456", "Holder", "12", "2028", "123"), null, 100, "idem-123");
        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(command, default));
    }

    [Fact]
    public async Task OrderCleanupJob_CancelsStaleOrdersInBoundedBatches()
    {
        using var db = TestDbContextFactory.Create();
        var p = new Product { Id = Guid.NewGuid(), Name = "P", SKU = "P-STALE", Price = 10, StockQuantity = 10, IsActive = true };
        db.Products.Add(p);
        for (int i = 0; i < 5; i++)
        {
            var o = new Order
            {
                Id = Guid.NewGuid(),
                OrderNumber = $"NX-STALE-{i}",
                UserId = Guid.NewGuid(),
                ShippingAddress = "Addr",
                TotalAmount = 20,
                Status = OrderStatus.Pending,
                PaymentStatus = PaymentStatus.Pending,
                CreatedAtUtc = DateTime.UtcNow.AddHours(-25),
                Items = new List<OrderItem> { new() { Id = Guid.NewGuid(), ProductId = p.Id, Product = p, ProductName = "P", Quantity = 1, UnitPrice = 10, TotalPrice = 10 } }
            };
            db.Orders.Add(o);
        }
        await db.SaveChangesAsync();

        var job = new OrderCleanupJob(db, NullLogger<OrderCleanupJob>.Instance, Mock.Of<IDbLogger>());
        await job.CancelStalePendingOrdersAsync();

        var remainingPending = await db.Orders.CountAsync(o => o.Status == OrderStatus.Pending);
        remainingPending.Should().Be(0);
        p.StockQuantity.Should().Be(15);
    }
}

