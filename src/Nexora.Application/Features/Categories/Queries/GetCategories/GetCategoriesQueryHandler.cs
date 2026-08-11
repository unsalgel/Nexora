using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Categories.Dtos;
using Nexora.Domain.Entities;

namespace Nexora.Application.Features.Categories.Queries.GetCategories;

public sealed class GetCategoriesQueryHandler : IRequestHandler<GetCategoriesQuery, Result<List<CategoryDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetCategoriesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<CategoryDto>>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        var allCategories = await _context.Categories
            .AsNoTracking()
            .Where(c => c.IsActive && !c.IsDeleted)
            .ToListAsync(cancellationToken);

        var categoryTree = BuildCategoryTree(allCategories, null);

        return Result<List<CategoryDto>>.Success(categoryTree);
    }

    private static List<CategoryDto> BuildCategoryTree(List<Category> allCategories, Guid? parentId)
    {
        return allCategories
            .Where(c => c.ParentCategoryId == parentId)
            .Select(c => new CategoryDto(
                c.Id,
                c.Name,
                c.Description,
                c.ParentCategoryId,
                allCategories.FirstOrDefault(p => p.Id == c.ParentCategoryId)?.Name,
                c.IsActive,
                BuildCategoryTree(allCategories, c.Id)))
            .ToList();
    }
}
