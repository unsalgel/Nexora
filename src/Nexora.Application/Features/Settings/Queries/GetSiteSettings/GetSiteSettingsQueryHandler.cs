using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Settings.Dtos;

namespace Nexora.Application.Features.Settings.Queries.GetSiteSettings;

public sealed class GetSiteSettingsQueryHandler : IRequestHandler<GetSiteSettingsQuery, Result<SiteSettingsDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSiteSettingsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<SiteSettingsDto>> Handle(GetSiteSettingsQuery request, CancellationToken cancellationToken)
    {
        var settings = await _context.Settings
            .AsNoTracking()
            .ToDictionaryAsync(s => s.Key, s => s.Value, cancellationToken);

        var dto = new SiteSettingsDto(
            SiteTitle: settings.GetValueOrDefault("SiteTitle", "Nexora - Alışverişin Yeni Adresi"),
            ContactEmail: settings.GetValueOrDefault("ContactEmail", "destek@nexora.com"),
            ContactPhone: settings.GetValueOrDefault("ContactPhone", "0850 123 45 67"),
            FreeShippingThreshold: decimal.TryParse(settings.GetValueOrDefault("FreeShippingThreshold", "150"), out var fst) ? fst : 150m,
            ShippingCost: decimal.TryParse(settings.GetValueOrDefault("ShippingCost", "29.90"), out var sc) ? sc : 29.90m,
            AnnouncementText: settings.GetValueOrDefault("AnnouncementText", "150 TL ve Üzeri Alışverişlerde Kargo Ücretsiz!"),
            IsAnnouncementActive: bool.TryParse(settings.GetValueOrDefault("IsAnnouncementActive", "true"), out var ia) && ia
        );

        return Result<SiteSettingsDto>.Success(dto);
    }
}
