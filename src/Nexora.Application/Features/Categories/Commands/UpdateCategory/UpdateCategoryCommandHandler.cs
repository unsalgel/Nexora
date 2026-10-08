using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Categories.Commands.UpdateCategory;

public sealed class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;
    private readonly IRealTimeNotificationService? _notificationService;

    public UpdateCategoryCommandHandler(
        IApplicationDbContext context,
        IRealTimeNotificationService? notificationService = null)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<Result<string>> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.Id && !c.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Güncellenecek kategori bulunamadı.");

        if (request.ParentCategoryId.HasValue && request.ParentCategoryId.Value == request.Id)
            throw new ConflictException("Bir kategori kendisinin üst kategorisi olarak seçilemez.");

        var nameExists = await _context.Categories
            .AnyAsync(c => c.Name == request.Name && c.Id != request.Id && !c.IsDeleted, cancellationToken);

        if (nameExists)
            throw new ConflictException("Bu isimde başka bir kategori zaten mevcut.");

        if (request.ParentCategoryId.HasValue)
        {
            var parentExists = await _context.Categories
                .AnyAsync(c => c.Id == request.ParentCategoryId.Value && !c.IsDeleted, cancellationToken);

            if (!parentExists)
                throw new NotFoundException("Seçilen üst kategori bulunamadı.");
        }

        category.Name = request.Name;
        category.Description = request.Description;
        category.ParentCategoryId = request.ParentCategoryId;
        category.IsActive = request.IsActive;

        await _context.SaveChangesAsync(cancellationToken);

        if (_notificationService is not null)
        {
            await _notificationService.PublishToAllAsync("CategoryStatusChanged", new
            {
                id = category.Id,
                name = category.Name,
                description = category.Description,
                parentCategoryId = category.ParentCategoryId,
                isActive = category.IsActive
            }, cancellationToken);
        }

        return Result<string>.Success("Kategori başarıyla güncellendi.");
    }
}
