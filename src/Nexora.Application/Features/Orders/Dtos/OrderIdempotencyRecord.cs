namespace Nexora.Application.Features.Orders.Dtos;

public sealed record OrderIdempotencyRecord(
    OrderDto OrderResult,
    string PayloadHash,
    DateTime CreatedAtUtc);
