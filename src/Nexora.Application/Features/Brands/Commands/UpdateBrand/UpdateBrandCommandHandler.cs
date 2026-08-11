using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Brands.Commands.UpdateBrand;

public sealed class UpdateBrandCommandHandler : IRequestHandler<UpdateBrandCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;

    public UpdateBrandCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(UpdateBrandCommand request, CancellationToken cancellationToken)
    {
        var brand = await _context.Brands
            .FirstOrDefaultAsync(b => b.Id == request.Id && !b.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Güncellenecek marka bulunamadı.");

        var nameExists = await _context.Brands
            .AnyAsync(b => b.Name == request.Name && b.Id != request.Id && !b.IsDeleted, cancellationToken);

        if (nameExists)
            throw new ConflictException("Bu isimde başka bir marka zaten mevcut.");

        brand.Name = request.Name;
        brand.LogoUrl = request.LogoUrl;
        brand.IsActive = request.IsActive;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success("Marka başarıyla güncellendi.");
    }
}
