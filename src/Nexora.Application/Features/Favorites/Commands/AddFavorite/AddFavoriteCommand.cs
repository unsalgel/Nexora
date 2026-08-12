using MediatR;
using Nexora.Application.Common;

namespace Nexora.Application.Features.Favorites.Commands.AddFavorite;

public sealed record AddFavoriteCommand(
    Guid UserId,
    Guid ProductId) : IRequest<Result<Guid>>;