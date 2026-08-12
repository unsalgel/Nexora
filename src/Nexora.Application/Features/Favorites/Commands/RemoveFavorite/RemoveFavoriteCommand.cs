using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Favorites.Commands.RemoveFavorite;

public sealed record RemoveFavoriteCommand(
    Guid UserId,
    Guid ProductId) : IRequest<Result<string>>;
