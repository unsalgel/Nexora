using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Auth.Commands.Login;

public sealed record LoginCommand(
    string Email,
    string Password) : IRequest<Result<AuthTokenDto>>;
