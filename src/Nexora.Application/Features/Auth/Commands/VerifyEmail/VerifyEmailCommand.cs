using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Auth.Commands.VerifyEmail;

public sealed record VerifyEmailCommand(string Email, string Code) : IRequest<Result<string>>;
