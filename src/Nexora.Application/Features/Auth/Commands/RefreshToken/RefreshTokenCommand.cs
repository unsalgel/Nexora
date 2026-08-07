using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Auth.Commands.RefreshToken;

public sealed record RefreshTokenCommand(string RefreshToken) : IRequest<Result<AuthTokenDto>>;
