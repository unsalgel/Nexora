using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Addresses.Commands.SetDefaultAddress;

public sealed class SetDefaultAddressCommandHandler : IRequestHandler<SetDefaultAddressCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;

    public SetDefaultAddressCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(SetDefaultAddressCommand request, CancellationToken cancellationToken)
    {
        var targetAddress = await _context.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == request.AddressId && a.UserId == request.UserId && !a.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Adres bulunamadı.");

        var currentDefaults = await _context.UserAddresses
            .Where(a => a.UserId == request.UserId && a.IsDefault && !a.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var addr in currentDefaults)
        {
            addr.IsDefault = false;
        }

        targetAddress.IsDefault = true;
        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success("Varsayılan adres başarıyla güncellendi.");
    }
}
