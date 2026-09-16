using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Settings.Dtos;
using Nexora.Domain.Entities;

namespace Nexora.Application.Features.Settings.Commands.UpdateSiteSettings;

public sealed class UpdateSiteSettingsCommandHandler : IRequestHandler<UpdateSiteSettingsCommand, Result<SiteSettingsDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IRealTimeNotificationService _notificationService;

    public UpdateSiteSettingsCommandHandler(
        IApplicationDbContext context,
        IRealTimeNotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<Result<SiteSettingsDto>> Handle(UpdateSiteSettingsCommand request, CancellationToken cancellationToken)
    {
        var existingSettings = await _context.Settings.ToListAsync(cancellationToken);
        var settingsDict = existingSettings.ToDictionary(s => s.Key);

        void Upsert(string key, string value, string description)
        {
            if (settingsDict.TryGetValue(key, out var setting))
            {
                setting.Value = value;
                setting.UpdatedAtUtc = DateTime.UtcNow;
            }
            else
            {
                _context.Settings.Add(new Setting
                {
                    Key = key,
                    Value = value,
                    Description = description
                });
            }
        }

        Upsert("SiteTitle", request.SiteTitle, "Site Başlığı");
        Upsert("ContactEmail", request.ContactEmail, "İletişim E-postası");
        Upsert("ContactPhone", request.ContactPhone, "İletişim Telefonu");
        Upsert("FreeShippingThreshold", request.FreeShippingThreshold.ToString("G"), "Ücretsiz Kargo Alt Limiti");
        Upsert("ShippingCost", request.ShippingCost.ToString("G"), "Sabit Kargo Tutarı");
        Upsert("AnnouncementText", request.AnnouncementText, "Üst Duyuru Metni");
        Upsert("IsAnnouncementActive", request.IsAnnouncementActive.ToString().ToLower(), "Duyuru Aktif mi");

        await _context.SaveChangesAsync(cancellationToken);

        var dto = new SiteSettingsDto(
            request.SiteTitle,
            request.ContactEmail,
            request.ContactPhone,
            request.FreeShippingThreshold,
            request.ShippingCost,
            request.AnnouncementText,
            request.IsAnnouncementActive
        );

        await _notificationService.PublishToAllAsync("SiteSettingsUpdated", dto, cancellationToken);

        return Result<SiteSettingsDto>.Success(dto, "Site ayarları başarıyla güncellendi.");
    }
}
