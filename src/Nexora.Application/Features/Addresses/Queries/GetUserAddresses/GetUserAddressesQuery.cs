using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Addresses.Dtos;

namespace Nexora.Application.Features.Addresses.Queries.GetUserAddresses;

public sealed record GetUserAddressesQuery(Guid UserId) : IRequest<Result<List<AddressDto>>>;

public sealed class GetUserAddressesQueryHandler : IRequestHandler<GetUserAddressesQuery, Result<List<AddressDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetUserAddressesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<AddressDto>>> Handle(GetUserAddressesQuery request, CancellationToken cancellationToken)
    {
        var addresses = await _context.UserAddresses
            .AsNoTracking()
            .Where(a => a.UserId == request.UserId && !a.IsDeleted)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedAtUtc)
            .Select(a => new AddressDto(
                a.Id,
                a.Title,
                a.FullName,
                a.PhoneNumber,
                a.City,
                a.District,
                a.DetailedAddress,
                a.PostalCode,
                a.IsDefault))
            .ToListAsync(cancellationToken);

        return Result<List<AddressDto>>.Success(addresses);
    }
}
