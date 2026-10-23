using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Brands.Commands.UpdateBrandStatus;

public sealed record UpdateBrandStatusCommand(Guid Id, bool IsActive) : IRequest<Result<string>>;

public sealed class UpdateBrandStatusCommandValidator : AbstractValidator<UpdateBrandStatusCommand>
{
    public UpdateBrandStatusCommandValidator() => RuleFor(x => x.Id).NotEmpty();
}

public sealed class UpdateBrandStatusCommandHandler(IApplicationDbContext context,
    IRealTimeNotificationService notifications, ILogger<UpdateBrandStatusCommandHandler> logger)
    : IRequestHandler<UpdateBrandStatusCommand, Result<string>>
{
    public async Task<Result<string>> Handle(UpdateBrandStatusCommand request, CancellationToken ct)
    {
        await using var transaction = await context.BeginTransactionAsync("media-reference", ct);
        await transaction.AcquireLockAsync(Products.CatalogRelations.LockKey, ct);
        var brand = await context.Brands.SingleOrDefaultAsync(b => b.Id == request.Id && !b.IsDeleted, ct)
            ?? throw new NotFoundException("Marka bulunamadı.");
        brand.IsActive = request.IsActive;
        await context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        await notifications.PublishToAllSafelyAsync("BrandStatusChanged", new
        { id = brand.Id, name = brand.Name, logoUrl = brand.LogoUrl, isActive = brand.IsActive }, logger, ct);
        return Result<string>.Success("Marka durumu güncellendi.");
    }
}
