using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Auth.Commands.ResendVerificationCode;

public sealed record ResendVerificationCodeCommand(string Email) : IRequest<Result<string>>;
