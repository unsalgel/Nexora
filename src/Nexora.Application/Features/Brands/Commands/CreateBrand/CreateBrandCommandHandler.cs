using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Brands.Commands.CreateBrand;

public sealed class CreateBrandCommandHandler : IRequestHandler<CreateBrandCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateBrandCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateBrandCommand request, CancellationToken cancellationToken)
    {
        var nameExists = await _context.Brands
            .AnyAsync(b => b.Name == request.Name && !b.IsDeleted, cancellationToken);

        if (nameExists)
            throw new ConflictException("Bu isimde bir marka zaten mevcut.");

        var brand = new Brand
        {
            Name = request.Name,
            LogoUrl = request.LogoUrl,
            IsActive = true,
            IsDeleted = false
        };

        _context.Brands.Add(brand);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(brand.Id, "Marka başarıyla oluşturuldu.");
    }
}
