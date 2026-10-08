using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Categories.Commands.CreateCategory;

public sealed class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;
    private readonly IRealTimeNotificationService? _notificationService;

    public CreateCategoryCommandHandler(
        IApplicationDbContext context,
        IRealTimeNotificationService? notificationService = null)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<Result<Guid>> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var nameExists = await _context.Categories
            .AnyAsync(c => c.Name == request.Name && !c.IsDeleted, cancellationToken);

        if (nameExists)
            throw new ConflictException("Bu isimde bir kategori zaten mevcut.");

        if (request.ParentCategoryId.HasValue)
        {
            var parentExists = await _context.Categories
                .AnyAsync(c => c.Id == request.ParentCategoryId.Value && !c.IsDeleted, cancellationToken);

            if (!parentExists)
                throw new NotFoundException("Seçilen üst kategori bulunamadı.");
        }

        var category = new Category
        {
            Name = request.Name,
            Description = request.Description,
            ParentCategoryId = request.ParentCategoryId,
            IsActive = true,
            IsDeleted = false
        };

        _context.Categories.Add(category);
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

        return Result<Guid>.Success(category.Id, "Kategori başarıyla oluşturuldu.");
    }
}
