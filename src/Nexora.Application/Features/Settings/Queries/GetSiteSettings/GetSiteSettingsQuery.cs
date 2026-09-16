using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Settings.Dtos;

namespace Nexora.Application.Features.Settings.Queries.GetSiteSettings;

public sealed record GetSiteSettingsQuery : IRequest<Result<SiteSettingsDto>>;
