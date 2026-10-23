using FluentAssertions;
using Microsoft.Extensions.Hosting;
using Moq;
using Nexora.Application.Features.Orders.Dtos;
using Nexora.Domain.Exceptions;
using Nexora.Infrastructure.Services;

namespace Nexora.UnitTests.Features.Payments;

public sealed class FakePaymentSafetyTests
{
    [Theory]
    [InlineData("Production")]
    [InlineData("Staging")]
    [InlineData("Testing")]
    [InlineData("")]
    public async Task NonDevelopmentCannotApproveSimulatedPayment(string environmentName)
    {
        var environment = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == environmentName);
        var service = new FakePaymentService(environment);
        var act = () => service.ProcessPaymentAsync(100m, Card("123"));
        await act.Should().ThrowAsync<ConflictException>();
    }

    [Theory]
    [InlineData("123", true)]
    [InlineData("000", false)]
    public async Task DevelopmentRetainsExplicitTestCardBehavior(string cvv, bool approved)
    {
        var environment = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Development);
        var service = new FakePaymentService(environment);
        (await service.ProcessPaymentAsync(100m, Card(cvv))).Should().Be(approved);
    }

    private static PaymentRequestDto Card(string cvv) =>
        new("Test User", "4242424242424242", "12", "2030", cvv);
}
