using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Brands.Commands.DeleteBrand;

public sealed class DeleteBrandCommandHandler : IRequestHandler<DeleteBrandCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;
    private readonly IRealTimeNotificationService? _notificationService;
    private readonly ILogger<DeleteBrandCommandHandler>? _logger;

    public DeleteBrandCommandHandler(
        IApplicationDbContext context,
        IRealTimeNotificationService? notificationService = null,
        ILogger<DeleteBrandCommandHandler>? logger = null)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<Result<string>> Handle(DeleteBrandCommand request, CancellationToken cancellationToken)
    {
        var brand = await _context.Brands
            .FirstOrDefaultAsync(b => b.Id == request.Id && !b.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Silinecek marka bulunamadı.");

        var hasActiveProducts = await _context.Products
            .AnyAsync(p => p.BrandId == request.Id && !p.IsDeleted && p.IsActive, cancellationToken);

        if (hasActiveProducts)
            throw new ConflictException("Bu markaya bağlı aktif ürünler bulunmaktadır. Markayı silmeden önce ürünleri başka bir markaya taşımalı veya pasife almalısınız.");

        brand.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);

        if (_notificationService is not null)
        {
            await _notificationService.PublishToAllSafelyAsync("BrandStatusChanged", new
            {
                id = brand.Id,
                name = brand.Name,
                logoUrl = brand.LogoUrl,
                isActive = false
            }, _logger, cancellationToken);
        }

        return Result<string>.Success("Marka başarıyla silindi.");
    }
}
