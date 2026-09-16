namespace Nexora.Application.Features.Settings.Dtos;

public sealed record SiteSettingsDto(
    string SiteTitle,
    string ContactEmail,
    string ContactPhone,
    decimal FreeShippingThreshold,
    decimal ShippingCost,
    string AnnouncementText,
    bool IsAnnouncementActive
);
