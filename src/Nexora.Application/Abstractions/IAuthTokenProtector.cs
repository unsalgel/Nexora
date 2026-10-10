namespace Nexora.Application.Abstractions;

public interface IAuthTokenProtector
{
    string HashRefreshToken(string token);
    string HashCode(Guid userId, string purpose, string code);
    bool VerifyCode(Guid userId, string purpose, string code, string hash);
}
