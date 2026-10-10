using FluentAssertions;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Nexora.Infrastructure.BackgroundJobs;
using Nexora.Infrastructure.Services;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.BackgroundJobs;

public sealed class EmailOutboxTests
{
    [Fact]
    public async Task StageEmail_RequiresCallerCommit_AndProtectsSensitivePayload()
    {
        await using var context = TestDbContextFactory.Create();
        var protection = new EphemeralDataProtectionProvider();
        var service = new HangfireEmailService(context, protection);
        await service.SendPasswordResetCodeEmailAsync("user@example.com", "Kullanıcı", "123456");
        (await context.OutboxMessages.CountAsync()).Should().Be(0);
        var staged = context.OutboxMessages.Local.Single();
        staged.ProtectedPayload.Should().NotContain("123456").And.NotContain("user@example.com");
        protection.CreateProtector(HangfireEmailService.ProtectionPurpose).Unprotect(staged.ProtectedPayload).Should().Contain("123456");
        await context.SaveChangesAsync();
        (await context.OutboxMessages.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Dispatch_WhenProductionSmtpUnavailable_PreservesPendingPayloadAndSchedulesRetry()
    {
        await using var context = TestDbContextFactory.Create();
        var protection = new EphemeralDataProtectionProvider();
        await new HangfireEmailService(context, protection).SendEmailVerificationCodeEmailAsync("user@example.com", "Kullanıcı", "987654");
        await context.SaveChangesAsync();
        var smtp = CreateSmtp(Environments.Production);
        var job = new EmailOutboxDispatchJob(context, protection, smtp, NullLogger<EmailOutboxDispatchJob>.Instance);
        await job.DispatchAsync();
        var message = await context.OutboxMessages.SingleAsync();
        message.ProcessedAtUtc.Should().BeNull();
        message.Attempts.Should().Be(1);
        message.AvailableAtUtc.Should().BeAfter(DateTime.UtcNow);
        message.LastError.Should().Be(nameof(InvalidOperationException));
        message.ProtectedPayload.Should().NotBeEmpty().And.NotContain("987654");
    }

    [Fact]
    public async Task Dispatch_WhenDevelopmentSimulationSucceeds_ErasesSensitivePayload()
    {
        await using var context = TestDbContextFactory.Create();
        var protection = new EphemeralDataProtectionProvider();
        await new HangfireEmailService(context, protection).SendWelcomeEmailAsync("user@example.com", "Kullanıcı");
        await context.SaveChangesAsync();
        var job = new EmailOutboxDispatchJob(context, protection, CreateSmtp(Environments.Development), NullLogger<EmailOutboxDispatchJob>.Instance);
        await job.DispatchAsync();
        var message = await context.OutboxMessages.SingleAsync();
        message.ProcessedAtUtc.Should().NotBeNull();
        message.ProtectedPayload.Should().BeEmpty();
        message.LastError.Should().BeNull();
    }

    private static SmtpEmailService CreateSmtp(string environmentName)
    {
        var environment = new Mock<IHostEnvironment>();
        environment.SetupGet(x => x.EnvironmentName).Returns(environmentName);
        return new SmtpEmailService(Options.Create(new EmailSettings()), NullLogger<SmtpEmailService>.Instance, environment: environment.Object);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Dispatch_WhenOtpExpiredOrAttemptsExhausted_TerminatesWithoutSmtpAndErasesPayload(bool exhaustAttempts)
    {
        await using var context = TestDbContextFactory.Create();
        var protection = new EphemeralDataProtectionProvider();
        await new HangfireEmailService(context, protection).SendPasswordResetCodeEmailAsync("user@example.com", "Kullanıcı", "123456");
        await context.SaveChangesAsync();
        var message = await context.OutboxMessages.SingleAsync();
        if (exhaustAttempts) message.Attempts = 10;
        else
        {
            message.CreatedAtUtc = DateTime.UtcNow.AddMinutes(-11);
            message.AvailableAtUtc = DateTime.UtcNow.AddHours(1);
        }
        context.SaveChanges();
        var job = new EmailOutboxDispatchJob(context, protection, CreateSmtp(Environments.Production), NullLogger<EmailOutboxDispatchJob>.Instance);
        await job.DispatchAsync();
        message.ProcessedAtUtc.Should().NotBeNull();
        message.ProtectedPayload.Should().BeEmpty();
        message.LastError.Should().Be(exhaustAttempts ? "AttemptsExhausted" : "Expired");
    }
}
