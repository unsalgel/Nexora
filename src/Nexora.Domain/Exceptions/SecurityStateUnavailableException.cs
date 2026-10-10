namespace Nexora.Domain.Exceptions;

public sealed class SecurityStateUnavailableException() : DomainException("Güvenli giriş servisi geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.", 503);
