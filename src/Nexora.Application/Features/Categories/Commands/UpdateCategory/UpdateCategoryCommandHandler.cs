using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Categories.Commands.UpdateCategory;

public sealed class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;
    private readonly IRealTimeNotificationService? _notificationService;
    private readonly ILogger<UpdateCategoryCommandHandler>? _logger;

    public UpdateCategoryCommandHandler(
        IApplicationDbContext context,
        IRealTimeNotificationService? notificationService = null,
        ILogger<UpdateCategoryCommandHandler>? logger = null)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<Result<string>> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        await using var transaction = await _context.BeginTransactionAsync("category-tree", cancellationToken);
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.Id && !c.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Güncellenecek kategori bulunamadı.");

        if (request.ParentCategoryId.HasValue && request.ParentCategoryId.Value == request.Id)
            throw new ConflictException("Bir kategori kendisinin üst kategorisi olarak seçilemez.");

        var nameExists = await _context.Categories
            .AnyAsync(c => c.Name == request.Name && c.Id != request.Id, cancellationToken);

        if (nameExists)
            throw new ConflictException("Bu isimde başka bir kategori zaten mevcut.");

        if (request.ParentCategoryId.HasValue)
        {
            var visited = new HashSet<Guid> { request.Id };
            Guid? ancestorId = request.ParentCategoryId;
            while (ancestorId.HasValue)
            {
                if (!visited.Add(ancestorId.Value))
                    throw new ConflictException("Üst kategori seçimi kategori ağacında döngü oluşturamaz.");
                var ancestor = await _context.Categories.AsNoTracking()
                    .Where(c => c.Id == ancestorId.Value && !c.IsDeleted)
                    .Select(c => new { c.ParentCategoryId })
                    .FirstOrDefaultAsync(cancellationToken)
                    ?? throw new NotFoundException("Seçilen üst kategori bulunamadı.");
                ancestorId = ancestor.ParentCategoryId;
            }
        }

        category.Name = request.Name;
        category.Description = request.Description;
        category.ParentCategoryId = request.ParentCategoryId;
        category.IsActive = request.IsActive;

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
                isActive = category.IsActive
            }, _logger, cancellationToken);
        }

        return Result<string>.Success("Kategori başarıyla güncellendi.");
    }
}
