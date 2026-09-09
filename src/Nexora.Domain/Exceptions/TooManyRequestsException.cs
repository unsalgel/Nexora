namespace Nexora.Domain.Exceptions;

public sealed class TooManyRequestsException : DomainException
{
    public TooManyRequestsException(string message) : base(message, 429) { }
}
