using Nexora.Domain.Exceptions;

namespace Nexora.Application.Common;

public static class Pagination
{
    public static int Offset(int page, int pageSize)
    {
        var offset = ((long)page - 1) * pageSize;
        if (page < 1 || pageSize is < 1 or > 100 || offset > 100_000)
            throw new BusinessValidationException("Sayfa 1 ve üzeri, sayfa boyutu 1–100 arasında olmalıdır. En fazla 100.000 kayıt atlanabilir; aramayı daraltın.");
        return (int)offset;
    }
}
