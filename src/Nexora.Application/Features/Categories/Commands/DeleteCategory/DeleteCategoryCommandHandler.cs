using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Categories.Commands.DeleteCategory;

public sealed class DeleteCategoryCommandHandler : IRequestHandler<DeleteCategoryCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;

    public DeleteCategoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.Id && !c.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Silinecek kategori bulunamadı.");

        var hasSubCategories = await _context.Categories
            .AnyAsync(c => c.ParentCategoryId == request.Id && !c.IsDeleted, cancellationToken);

        if (hasSubCategories)
            throw new ConflictException("Bu kategoriye bağlı alt kategoriler bulunmaktadır. Önce alt kategorileri silmelisiniz.");

        category.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success("Kategori başarıyla silindi.");
    }
}
