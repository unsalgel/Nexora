using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Settings.Dtos;

namespace Nexora.Application.Features.Settings.Commands.UpdateSiteSettings;

public sealed record UpdateSiteSettingsCommand(
    string SiteTitle,
    string ContactEmail,
    string ContactPhone,
    decimal FreeShippingThreshold,
    decimal ShippingCost,
    string AnnouncementText,
    bool IsAnnouncementActive
) : IRequest<Result<SiteSettingsDto>>;
