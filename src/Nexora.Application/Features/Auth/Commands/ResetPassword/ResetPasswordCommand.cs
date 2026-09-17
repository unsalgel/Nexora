using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Auth.Commands.ResetPassword;

public sealed record ResetPasswordCommand(
    string Email,
    string Code,
    string NewPassword) : IRequest<Result<string>>;
