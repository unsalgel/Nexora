using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Brands.Commands.UpdateBrand;

public sealed class UpdateBrandCommandHandler : IRequestHandler<UpdateBrandCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;
    private readonly IRealTimeNotificationService? _notificationService;
    private readonly ILogger<UpdateBrandCommandHandler>? _logger;

    public UpdateBrandCommandHandler(
        IApplicationDbContext context,
        IRealTimeNotificationService? notificationService = null,
        ILogger<UpdateBrandCommandHandler>? logger = null)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<Result<string>> Handle(UpdateBrandCommand request, CancellationToken cancellationToken)
    {
        await using var transaction = await _context.BeginTransactionAsync("media-reference", cancellationToken);
        var brand = await _context.Brands
            .FirstOrDefaultAsync(b => b.Id == request.Id && !b.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Güncellenecek marka bulunamadı.");

        var nameExists = await _context.Brands
            .AnyAsync(b => b.Name == request.Name && b.Id != request.Id, cancellationToken);

        if (nameExists)
            throw new ConflictException("Bu isimde başka bir marka zaten mevcut.");

        brand.Name = request.Name;
        brand.LogoUrl = request.LogoUrl;
        brand.IsActive = request.IsActive;

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        if (_notificationService is not null)
        {
            await _notificationService.PublishToAllSafelyAsync("BrandStatusChanged", new
            {
                id = brand.Id,
                name = brand.Name,
                logoUrl = brand.LogoUrl,
                isActive = brand.IsActive
            }, _logger, cancellationToken);
        }

        return Result<string>.Success("Marka başarıyla güncellendi.");
    }
}
