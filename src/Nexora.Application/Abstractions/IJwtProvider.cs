using Nexora.Domain.Entities;

namespace Nexora.Application.Abstractions;

public interface IJwtProvider
{
    string GenerateAccessToken(User user, IList<string> roles);
    string GenerateRefreshToken();
}
