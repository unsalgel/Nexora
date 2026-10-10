using FluentAssertions;
using Moq;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Settings.Commands.UpdateSiteSettings;
using Nexora.UnitTests.Common;

namespace Nexora.UnitTests.Features.Settings;

public sealed class SiteSettingsSideEffectTests
{
    [Fact]
    public async Task UpdateSettings_WhenRealtimeTransportFails_StillReturnsCommittedValues()
    {
        await using var context = TestDbContextFactory.Create();
        var notification = new Mock<IRealTimeNotificationService>();
        notification.Setup(x => x.PublishToAllAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new IOException("Bağlantı kapalı"));
        var handler = new UpdateSiteSettingsCommandHandler(context, notification.Object);
        var result = await handler.Handle(new("Test Site", "test@example.com", "555", 1000m, 50m, "Test", true), CancellationToken.None);
        result.IsSuccess.Should().BeTrue();
        context.ChangeTracker.Clear();
        context.Settings.Single(x => x.Key == "SiteTitle").Value.Should().Be("Test Site");
    }
}
