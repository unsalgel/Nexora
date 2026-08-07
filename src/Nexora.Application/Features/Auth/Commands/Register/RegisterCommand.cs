using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Auth.Commands.Register;

public sealed record RegisterCommand(
    string FirstName,
    string LastName,
    string Email,
    string Password) : IRequest<Result<string>>;
