using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Auth.Dtos;

namespace Nexora.Application.Features.Auth.Commands.RefreshToken;

public sealed record RefreshTokenCommand(string RefreshToken) : IRequest<Result<AuthTokenDto>>;
