using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Auth.Dtos;

namespace Nexora.Application.Features.Auth.Commands.Login;

public sealed record LoginCommand(
    string Email,
    string Password,
    string? IpAddress = null) : IRequest<Result<AuthTokenDto>>;
