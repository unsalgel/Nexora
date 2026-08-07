using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Categories.Queries.GetCategoryById;

public sealed class GetCategoryByIdQueryHandler : IRequestHandler<GetCategoryByIdQuery, Result<CategoryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCategoryByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CategoryDto>> Handle(GetCategoryByIdQuery request, CancellationToken cancellationToken)
    {
        var category = await _context.Categories
            .AsNoTracking()
            .Include(c => c.ParentCategory)
            .Include(c => c.SubCategories.Where(sc => sc.IsActive && !sc.IsDeleted))
            .FirstOrDefaultAsync(c => c.Id == request.Id && c.IsActive && !c.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Kategori bulunamadı.");

        var subCategoryDtos = category.SubCategories
            .Select(sc => new CategoryDto(
                sc.Id,
                sc.Name,
                sc.Description,
                sc.ParentCategoryId,
                category.Name,
                sc.IsActive,
                null))
            .ToList();

        var dto = new CategoryDto(
            category.Id,
            category.Name,
            category.Description,
            category.ParentCategoryId,
            category.ParentCategory?.Name,
            category.IsActive,
            subCategoryDtos);

        return Result<CategoryDto>.Success(dto);
    }
}
