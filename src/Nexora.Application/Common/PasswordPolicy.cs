using System.Text;

namespace Nexora.Application.Common;

public static class PasswordPolicy
{
    public static bool FitsBcrypt(string? password) =>
        password is not null && Encoding.UTF8.GetByteCount(password) <= 72;
}
