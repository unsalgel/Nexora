namespace Nexora.Domain.Exceptions;

public abstract class DomainException : Exception
{
    public int StatusCode { get; }

    protected DomainException(string message, int statusCode = 400) : base(message)
    {
        StatusCode = statusCode;
    }
}
