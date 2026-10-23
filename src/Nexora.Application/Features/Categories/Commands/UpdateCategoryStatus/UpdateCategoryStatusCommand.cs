using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Categories.Commands.UpdateCategoryStatus;

public sealed record UpdateCategoryStatusCommand(Guid Id, bool IsActive) : IRequest<Result<string>>;

public sealed class UpdateCategoryStatusCommandValidator : AbstractValidator<UpdateCategoryStatusCommand>
{
    public UpdateCategoryStatusCommandValidator() => RuleFor(x => x.Id).NotEmpty();
}

public sealed class UpdateCategoryStatusCommandHandler(IApplicationDbContext context,
    IRealTimeNotificationService notifications, ILogger<UpdateCategoryStatusCommandHandler> logger)
    : IRequestHandler<UpdateCategoryStatusCommand, Result<string>>
{
    public async Task<Result<string>> Handle(UpdateCategoryStatusCommand request, CancellationToken ct)
    {
        await using var transaction = await context.BeginTransactionAsync("category-tree", ct);
        var category = await context.Categories.SingleOrDefaultAsync(c => c.Id == request.Id && !c.IsDeleted, ct)
            ?? throw new NotFoundException("Kategori bulunamadı.");
        category.IsActive = request.IsActive;
        await context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        await notifications.PublishToAllSafelyAsync("CategoryStatusChanged", new
        { id = category.Id, name = category.Name, description = category.Description, parentCategoryId = category.ParentCategoryId, isActive = category.IsActive }, logger, ct);
        return Result<string>.Success("Kategori durumu güncellendi.");
    }
}
