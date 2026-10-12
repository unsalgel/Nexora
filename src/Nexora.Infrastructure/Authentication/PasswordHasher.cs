using Nexora.Application.Common;
using Nexora.Domain.Exceptions;
using Nexora.Application.Abstractions;

namespace Nexora.Infrastructure.Authentication;

public sealed class PasswordHasher : IPasswordHasher
{
    public string Hash(string password)
    {
        if (!PasswordPolicy.FitsBcrypt(password)) throw new BusinessValidationException("Şifre UTF-8 olarak en fazla 72 byte olabilir.");
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public bool Verify(string password, string passwordHash)
    {
        return PasswordPolicy.FitsBcrypt(password) && BCrypt.Net.BCrypt.Verify(password, passwordHash);
    }
}
