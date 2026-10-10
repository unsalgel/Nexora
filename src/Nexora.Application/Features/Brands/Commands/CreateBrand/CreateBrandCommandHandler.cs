using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Brands.Commands.CreateBrand;

public sealed class CreateBrandCommandHandler : IRequestHandler<CreateBrandCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;
    private readonly IRealTimeNotificationService? _notificationService;
    private readonly ILogger<CreateBrandCommandHandler>? _logger;

    public CreateBrandCommandHandler(
        IApplicationDbContext context,
        IRealTimeNotificationService? notificationService = null,
        ILogger<CreateBrandCommandHandler>? logger = null)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(CreateBrandCommand request, CancellationToken cancellationToken)
    {
        await using var transaction = await _context.BeginTransactionAsync("media-reference", cancellationToken);
        var nameExists = await _context.Brands
            .AnyAsync(b => b.Name == request.Name, cancellationToken);

        if (nameExists)
            throw new ConflictException("Bu isimde bir marka zaten mevcut.");

        var brand = new Brand
        {
            Name = request.Name,
            LogoUrl = request.LogoUrl,
            IsActive = true,
            IsDeleted = false
        };

        _context.Brands.Add(brand);
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

        return Result<Guid>.Success(brand.Id, "Marka başarıyla oluşturuldu.");
    }
}
