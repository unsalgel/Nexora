using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Dashboard.Dtos;

namespace Nexora.Application.Features.Dashboard.Queries.GetSalesAnalytics;

public sealed record GetSalesAnalyticsQuery(int Days = 30) : IRequest<Result<SalesAnalyticsDto>>;
