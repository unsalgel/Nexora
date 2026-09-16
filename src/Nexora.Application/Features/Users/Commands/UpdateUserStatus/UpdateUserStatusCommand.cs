using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Users.Commands.UpdateUserStatus;

public sealed record UpdateUserStatusCommand(Guid Id, bool IsActive) : IRequest<Result<bool>>;
