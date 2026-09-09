using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Addresses.Commands.SetDefaultAddress;

public sealed record SetDefaultAddressCommand(Guid AddressId, Guid UserId) : IRequest<Result<string>>;
