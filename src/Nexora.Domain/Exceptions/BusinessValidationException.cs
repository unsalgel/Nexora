namespace Nexora.Domain.Exceptions;

// İş kuralları veya dosya doğrulama hataları için genel doğrulama istisnası
public sealed class BusinessValidationException : DomainException
{
    public BusinessValidationException(string message) : base(message, 400)
    {
    }
}
