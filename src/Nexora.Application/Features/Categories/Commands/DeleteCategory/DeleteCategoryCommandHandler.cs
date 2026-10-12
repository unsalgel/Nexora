using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Categories.Commands.DeleteCategory;

public sealed class DeleteCategoryCommandHandler : IRequestHandler<DeleteCategoryCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;
    private readonly IRealTimeNotificationService? _notificationService;
    private readonly ILogger<DeleteCategoryCommandHandler>? _logger;

    public DeleteCategoryCommandHandler(
        IApplicationDbContext context,
        IRealTimeNotificationService? notificationService = null,
        ILogger<DeleteCategoryCommandHandler>? logger = null)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<Result<string>> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        await using var transaction = await _context.BeginTransactionAsync("category-tree", cancellationToken);
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.Id && !c.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Silinecek kategori bulunamadı.");

        var hasSubCategories = await _context.Categories
            .AnyAsync(c => c.ParentCategoryId == request.Id && !c.IsDeleted, cancellationToken);

        if (hasSubCategories)
            throw new ConflictException("Bu kategoriye bağlı alt kategoriler bulunmaktadır. Önce alt kategorileri silmelisiniz.");

        var hasActiveProducts = await _context.Products
            .AnyAsync(p => p.CategoryId == request.Id && !p.IsDeleted && p.IsActive, cancellationToken);

        if (hasActiveProducts)
            throw new ConflictException("Bu kategoriye bağlı aktif ürünler bulunmaktadır. Kategoriyi silmeden önce ürünleri başka bir kategoriye taşımalı veya pasife almalısınız.");

        category.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        if (_notificationService is not null)
        {
            await _notificationService.PublishToAllSafelyAsync("CategoryStatusChanged", new
            {
                id = category.Id,
                name = category.Name,
                description = category.Description,
                parentCategoryId = category.ParentCategoryId,
                isActive = false
            }, _logger, cancellationToken);
        }

        return Result<string>.Success("Kategori başarıyla silindi.");
    }
}
