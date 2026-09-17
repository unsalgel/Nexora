using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Auth.Commands.ForgotPassword;

public sealed record ForgotPasswordCommand(string Email) : IRequest<Result<string>>;
