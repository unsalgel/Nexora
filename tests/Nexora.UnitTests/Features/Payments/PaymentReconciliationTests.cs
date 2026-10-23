using FluentAssertions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Payments.Commands.CompletePayment;
using Nexora.Application.Features.Payments.Commands.InitializePayment;
using Nexora.Application.Features.Payments.Dtos;
using Nexora.Domain.Enums;
using Nexora.Infrastructure;
using Nexora.Infrastructure.BackgroundJobs;
using Nexora.Infrastructure.Payments;
using Nexora.Persistence.Context;
using Nexora.UnitTests.Features.Orders;

namespace Nexora.UnitTests.Features.Payments;

public sealed class PaymentReconciliationTests
{
    [Fact]
    public async Task JobRecoversPayment_WhenBrowserNeverReturns()
    {
        var options = new DbContextOptionsBuilder<NexoraDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var gateway = PaymentCommandHandlerTests.CreateGateway();
        await using (var seed = new NexoraDbContext(options))
        {
            var data = await CommerceRegressionTests.SeedCartAsync(seed);
            var result = await new InitializePaymentCommandHandler(seed, gateway.Object).Handle(new("Adres") { UserId = data.User.Id }, default);
            var order = await seed.Orders.SingleAsync();
            order.NextPaymentCheckAtUtc = DateTime.UtcNow.AddMinutes(-1);
            await seed.SaveChangesAsync();
            gateway.Setup(g => g.VerifyPaymentAsync(It.IsAny<PaymentVerificationRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new PaymentVerificationResult(true, "recovered", order.OrderNumber, order.TotalAmount, null, FraudStatus: 1, Currency: "TRY"));
        }
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddScoped<IApplicationDbContext>(_ => new NexoraDbContext(options));
        services.AddSingleton(gateway.Object);
        services.AddSingleton(Mock.Of<IEmailService>());
        services.AddMediatR(c => c.RegisterServicesFromAssemblyContaining<CompletePaymentCommandHandler>());
        using var provider = services.BuildServiceProvider();
        var job = new PaymentReconciliationJob(provider.GetRequiredService<IServiceScopeFactory>(), NullLogger<PaymentReconciliationJob>.Instance);
        await job.RunAsync(); await job.RunAsync();
        await using var check = new NexoraDbContext(options);
        (await check.Orders.SingleAsync()).PaymentStatus.Should().Be(PaymentStatus.Success);
        (await check.Products.SingleAsync()).StockQuantity.Should().Be(4);
        (await check.Notifications.CountAsync(n => n.Type == NotificationType.OrderCreated)).Should().Be(1);
        gateway.Verify(g => g.VerifyPaymentAsync(It.IsAny<PaymentVerificationRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public void CallbackEnvironmentVariableOverridesNestedConfiguration()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=test",
            ["PaymentSettings:Iyzico:BaseUrl"] = "https://sandbox-api.iyzipay.com",
            ["PaymentSettings:Iyzico:CallbackUrl"] = "https://old.example/api/v1/payments/callback",
            ["IYZICO_CALLBACK_URL"] = "https://current.example/api/v1/payments/callback",
            ["IYZICO_API_KEY"] = "test-key", ["IYZICO_SECRET_KEY"] = "test-secret"
        }).Build();
        var services = new ServiceCollection();
        services.AddSingleton(Mock.Of<IHostEnvironment>(e => e.EnvironmentName == "Production"));
        services.AddInfrastructure(config);
        using var provider = services.BuildServiceProvider();
        provider.GetRequiredService<IOptions<IyzicoSettings>>().Value.CallbackUrl.Should().Be("https://current.example/api/v1/payments/callback");
    }
}
