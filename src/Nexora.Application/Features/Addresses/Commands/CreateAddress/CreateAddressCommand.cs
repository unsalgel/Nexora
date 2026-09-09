using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Addresses.Dtos;
using Nexora.Domain.Entities;

namespace Nexora.Application.Features.Addresses.Commands.CreateAddress;

public sealed record CreateAddressCommand(
    Guid UserId,
    string Title,
    string FullName,
    string PhoneNumber,
    string City,
    string District,
    string DetailedAddress,
    string? PostalCode = null,
    bool IsDefault = false) : IRequest<Result<AddressDto>>;

public sealed class CreateAddressCommandHandler : IRequestHandler<CreateAddressCommand, Result<AddressDto>>
{
    private readonly IApplicationDbContext _context;

    public CreateAddressCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<AddressDto>> Handle(CreateAddressCommand request, CancellationToken cancellationToken)
    {
        var hasAnyAddress = await _context.UserAddresses
            .AnyAsync(a => a.UserId == request.UserId && !a.IsDeleted, cancellationToken);

        var isDefault = request.IsDefault || !hasAnyAddress;

        if (isDefault && hasAnyAddress)
        {
            var existingDefaults = await _context.UserAddresses
                .Where(a => a.UserId == request.UserId && a.IsDefault && !a.IsDeleted)
                .ToListAsync(cancellationToken);

            foreach (var addr in existingDefaults)
            {
                addr.IsDefault = false;
            }
        }

        var address = new UserAddress
        {
            UserId = request.UserId,
            Title = request.Title.Trim(),
            FullName = request.FullName.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
            City = request.City.Trim(),
            District = request.District.Trim(),
            DetailedAddress = request.DetailedAddress.Trim(),
            PostalCode = request.PostalCode?.Trim(),
            IsDefault = isDefault
        };

        _context.UserAddresses.Add(address);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = new AddressDto(
            address.Id,
            address.Title,
            address.FullName,
            address.PhoneNumber,
            address.City,
            address.District,
            address.DetailedAddress,
            address.PostalCode,
            address.IsDefault);

        return Result<AddressDto>.Success(dto);
    }
}
