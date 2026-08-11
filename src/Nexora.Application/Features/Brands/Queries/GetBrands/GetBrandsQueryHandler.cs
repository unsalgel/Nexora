using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Brands.Dtos;

namespace Nexora.Application.Features.Brands.Queries.GetBrands;

public sealed class GetBrandsQueryHandler : IRequestHandler<GetBrandsQuery, Result<List<BrandDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetBrandsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<BrandDto>>> Handle(GetBrandsQuery request, CancellationToken cancellationToken)
    {
        var brands = await _context.Brands
            .AsNoTracking()
            .Where(b => b.IsActive && !b.IsDeleted)
            .OrderBy(b => b.Name)
            .Select(b => new BrandDto(b.Id, b.Name, b.LogoUrl, b.IsActive))
            .ToListAsync(cancellationToken);

        return Result<List<BrandDto>>.Success(brands);
    }
}
