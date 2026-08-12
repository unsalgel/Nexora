namespace Nexora.Application.Features.Cart.Dtos;

public sealed record CartDto(
    Guid Id,
    Guid UserId,
    List<CartItemDto> Items,
    decimal GrandTotal);
