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
        var query = _context.Categories
            .AsNoTracking()
            .Where(c => !c.IsDeleted);

        if (request.IsActive.HasValue)
        {
            query = query.Where(c => c.IsActive == request.IsActive.Value);
        }

        var allCategories = await query
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);

        var dtos = allCategories.Select(c => new CategoryDto(
            c.Id,
            c.Name,
            c.Description,
            c.ParentCategoryId,
            allCategories.FirstOrDefault(p => p.Id == c.ParentCategoryId)?.Name,
            c.IsActive,
            new List<CategoryDto>()))
            .ToList();

        return Result<List<CategoryDto>>.Success(dtos);
    }
}
