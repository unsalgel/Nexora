using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Brands.Queries.GetBrandById;

public sealed class GetBrandByIdQueryHandler : IRequestHandler<GetBrandByIdQuery, Result<BrandDto>>
{
    private readonly IApplicationDbContext _context;

    public GetBrandByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<BrandDto>> Handle(GetBrandByIdQuery request, CancellationToken cancellationToken)
    {
        var brand = await _context.Brands
            .AsNoTracking()
            .Where(b => b.Id == request.Id && b.IsActive && !b.IsDeleted)
            .Select(b => new BrandDto(b.Id, b.Name, b.LogoUrl, b.IsActive))
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Marka bulunamadı.");

        return Result<BrandDto>.Success(brand);
    }
}
