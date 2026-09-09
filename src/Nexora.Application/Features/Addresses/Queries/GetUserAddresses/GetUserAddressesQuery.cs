using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Addresses.Dtos;

namespace Nexora.Application.Features.Addresses.Queries.GetUserAddresses;

public sealed record GetUserAddressesQuery(Guid UserId) : IRequest<Result<List<AddressDto>>>;
