using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Auth.Commands.RevokeToken;

public sealed record RevokeTokenCommand(string RefreshToken, string? Jti = null) : IRequest<Result<string>>;
