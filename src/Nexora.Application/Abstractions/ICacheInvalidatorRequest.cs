namespace Nexora.Application.Abstractions;

public interface ICacheInvalidatorRequest
{
    string CacheKeyPrefix { get; }
}
