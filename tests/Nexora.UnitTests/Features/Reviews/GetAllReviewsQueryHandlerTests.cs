using FluentAssertions;
using Nexora.Application.Features.Reviews.Queries.GetAllReviews;
using Nexora.Domain.Entities;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Reviews;

public sealed class GetAllReviewsQueryHandlerTests : IDisposable
{
    private readonly NexoraDbContext _context;
    private readonly GetAllReviewsQueryHandler _handler;

    public GetAllReviewsQueryHandlerTests()
    {
        _context = TestDbContextFactory.Create();
        _handler = new GetAllReviewsQueryHandler(_context);
    }

    public void Dispose()
    {
        TestDbContextFactory.Destroy(_context);
    }

    [Fact]
    public async Task Handle_WithRatingFilter_ReturnsFilteredReviews()
    {
        var user = new User { Id = Guid.NewGuid(), FirstName = "Ali", LastName = "Veli", Email = "ali@test.com", PasswordHash = "hash" };
        var product = new Product { Id = Guid.NewGuid(), Name = "Gaming Kulaklık", SKU = "GK-01", Description = "Kulaklık", Price = 500, StockQuantity = 10, CategoryId = Guid.NewGuid() };
        _context.Users.Add(user);
        _context.Products.Add(product);

        var r1 = new Review { Id = Guid.NewGuid(), ProductId = product.Id, UserId = user.Id, Rating = 5, Comment = "Harika", CreatedAtUtc = DateTime.UtcNow };
        var r2 = new Review { Id = Guid.NewGuid(), ProductId = product.Id, UserId = user.Id, Rating = 3, Comment = "Normal", CreatedAtUtc = DateTime.UtcNow };
        _context.Reviews.AddRange(r1, r2);
        await _context.SaveChangesAsync();

        var query = new GetAllReviewsQuery(Rating: 5);
        var result = await _handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data!.Items.Should().HaveCount(1);
        result.Data.Items[0].Rating.Should().Be(5);
        result.Data.Items[0].ProductName.Should().Be("Gaming Kulaklık");
    }
}
