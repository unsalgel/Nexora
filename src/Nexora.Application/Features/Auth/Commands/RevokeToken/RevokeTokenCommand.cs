using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Auth.Commands.RevokeToken;

public sealed record RevokeTokenCommand(string? RefreshToken, Guid? SessionId = null, Guid? UserId = null) : IRequest<Result<string>>;
