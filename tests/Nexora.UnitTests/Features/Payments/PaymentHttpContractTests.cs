using System.Net;
using System.Net.Http.Json;
using System.Text.Encodings.Web;
using Asp.Versioning;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Nexora.Api.Controllers;
using Nexora.Application.Common;
using Nexora.Application.Features.Payments.Commands.CompletePayment;
using Nexora.Application.Features.Payments.Dtos;

namespace Nexora.UnitTests.Features.Payments;

public sealed class PaymentHttpContractTests
{
    [Fact]
    public async Task ProviderFormPost_RedirectsToTrustedResultPage_AndStatusRequiresLogin()
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Development" });
        builder.Logging.ClearProviders(); builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?> { ["Frontend:BaseUrl"] = "https://shop.example.test" });
        builder.Services.AddControllers().AddApplicationPart(typeof(PaymentsController).Assembly);
        builder.Services.AddApiVersioning(o => { o.DefaultApiVersion = new ApiVersion(1, 0); o.ApiVersionReader = new UrlSegmentApiVersionReader(); });
        builder.Services.AddAuthentication("test").AddScheme<AuthenticationSchemeOptions, AnonymousHandler>("test", _ => { });
        builder.Services.AddAuthorization();
        var sender = new Mock<ISender>();
        sender.Setup(s => s.Send(It.IsAny<IRequest<Result<PaymentVerificationResult>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<PaymentVerificationResult>.Success(new(true, "payment", "NX-20261023-1234ABCD", 100, null)));
        builder.Services.AddSingleton(sender.Object);
        await using var app = builder.Build(); app.UseAuthentication(); app.UseAuthorization(); app.MapControllers();
        await app.StartAsync();
        try
        {
            var address = app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()!.Addresses.Single();
            using var client = new HttpClient(new HttpClientHandler { AllowAutoRedirect = false }) { BaseAddress = new Uri(address) };
            var form = await client.PostAsync("/api/v1/payments/callback", new FormUrlEncodedContent(new Dictionary<string, string> { ["token"] = "provider-token" }));
            form.StatusCode.Should().Be(HttpStatusCode.SeeOther);
            form.Headers.Location!.AbsoluteUri.Should().Be("https://shop.example.test/payment-result?order=NX-20261023-1234ABCD");
            sender.Verify(s => s.Send(It.Is<CompletePaymentCommand>(c => c.Token == "provider-token"), It.IsAny<CancellationToken>()), Times.Once);
            var json = await client.PostAsJsonAsync("/api/v1/payments/callback", new { token = "provider-token" });
            json.StatusCode.Should().Be(HttpStatusCode.UnsupportedMediaType);
            (await client.GetAsync("/api/v1/payments/status/NX-20261023-1234ABCD")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
            (await client.PostAsJsonAsync("/api/v1/orders", new { paymentInfo = new { cardNumber = "4242424242424242" } }))
                .StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
        }
        finally { await app.StopAsync(); }
    }

    private sealed class AnonymousHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
        : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync() => Task.FromResult(AuthenticateResult.NoResult());
    }
}
