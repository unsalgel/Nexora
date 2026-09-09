using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Addresses.Commands.DeleteAddress;

public sealed record DeleteAddressCommand(Guid AddressId, Guid UserId) : IRequest<Result<string>>;

public sealed class DeleteAddressCommandHandler : IRequestHandler<DeleteAddressCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;

    public DeleteAddressCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(DeleteAddressCommand request, CancellationToken cancellationToken)
    {
        var address = await _context.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == request.AddressId && a.UserId == request.UserId && !a.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Adres bulunamadı.");

        address.IsDeleted = true;

        if (address.IsDefault)
        {
            var nextAddress = await _context.UserAddresses
                .Where(a => a.UserId == request.UserId && a.Id != address.Id && !a.IsDeleted)
                .OrderByDescending(a => a.CreatedAtUtc)
                .FirstOrDefaultAsync(cancellationToken);

            if (nextAddress is not null)
            {
                nextAddress.IsDefault = true;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success("Adres başarıyla silindi.");
    }
}
