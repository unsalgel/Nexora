using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Domain.Entities;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.ProductAttributes;

public sealed record AttributeValueDto(Guid Id, string Value);
public sealed record AttributeDto(Guid Id, string Name, List<AttributeValueDto> Values);
public sealed record GetAttributesQuery : IRequest<Result<List<AttributeDto>>>;
public sealed record SaveAttributeCommand(Guid? Id, string Name) : IRequest<Result<Guid>>;
public sealed record DeleteAttributeCommand(Guid Id) : IRequest<Result<bool>>;
public sealed record SaveAttributeValueCommand(Guid AttributeId, Guid? Id, string Value) : IRequest<Result<Guid>>;
public sealed record DeleteAttributeValueCommand(Guid Id) : IRequest<Result<bool>>;

public sealed class AttributeManagement(IApplicationDbContext context) :
    IRequestHandler<GetAttributesQuery, Result<List<AttributeDto>>>,
    IRequestHandler<SaveAttributeCommand, Result<Guid>>,
    IRequestHandler<DeleteAttributeCommand, Result<bool>>,
    IRequestHandler<SaveAttributeValueCommand, Result<Guid>>,
    IRequestHandler<DeleteAttributeValueCommand, Result<bool>>
{
    public async Task<Result<List<AttributeDto>>> Handle(GetAttributesQuery request, CancellationToken ct) =>
        Result<List<AttributeDto>>.Success(await context.ProductAttributes.AsNoTracking().OrderBy(a => a.Name)
            .Select(a => new AttributeDto(a.Id, a.Name, a.Values.OrderBy(v => v.Value)
                .Select(v => new AttributeValueDto(v.Id, v.Value)).ToList())).ToListAsync(ct));

    private static string Validate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Trim().Length > 100)
            throw new BusinessValidationException("Özellik ve değer adları 1–100 karakter olmalıdır.");
        return value.Trim();
    }

    public async Task<Result<Guid>> Handle(SaveAttributeCommand request, CancellationToken ct)
    {
        var name = Validate(request.Name);
        await using var transaction = await context.BeginTransactionAsync("catalog-attributes", ct);
        if (await context.ProductAttributes.AnyAsync(a => a.Name.ToLower() == name.ToLower() && a.Id != request.Id, ct))
            throw new ConflictException("Bu özellik zaten mevcut.");
        var attribute = request.Id.HasValue
            ? await context.ProductAttributes.SingleOrDefaultAsync(a => a.Id == request.Id, ct) ?? throw new NotFoundException("Özellik bulunamadı.")
            : new ProductAttribute();
        attribute.Name = name;
        if (!request.Id.HasValue) context.ProductAttributes.Add(attribute);
        await context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return Result<Guid>.Success(attribute.Id);
    }

    public async Task<Result<Guid>> Handle(SaveAttributeValueCommand request, CancellationToken ct)
    {
        var text = Validate(request.Value);
        await using var transaction = await context.BeginTransactionAsync("catalog-attributes", ct);
        if (!await context.ProductAttributes.AnyAsync(a => a.Id == request.AttributeId, ct)) throw new NotFoundException("Özellik bulunamadı.");
        if (await context.ProductAttributeValues.AnyAsync(v => v.ProductAttributeId == request.AttributeId && v.Id != request.Id && v.Value.ToLower() == text.ToLower(), ct))
            throw new ConflictException("Bu özellik değeri zaten mevcut.");
        var value = request.Id.HasValue
            ? await context.ProductAttributeValues.SingleOrDefaultAsync(v => v.Id == request.Id && v.ProductAttributeId == request.AttributeId, ct) ?? throw new NotFoundException("Değer bulunamadı.")
            : new ProductAttributeValue { ProductAttributeId = request.AttributeId };
        value.Value = text;
        if (!request.Id.HasValue) context.ProductAttributeValues.Add(value);
        await context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return Result<Guid>.Success(value.Id);
    }

    public async Task<Result<bool>> Handle(DeleteAttributeCommand request, CancellationToken ct)
    {
        await using var transaction = await context.BeginTransactionAsync("catalog-attributes", ct);
        var attribute = await context.ProductAttributes.SingleOrDefaultAsync(a => a.Id == request.Id, ct) ?? throw new NotFoundException("Özellik bulunamadı.");
        if (await context.ProductVariantAttributeValues.AnyAsync(v => v.ProductAttributeValue.ProductAttributeId == request.Id, ct))
            throw new ConflictException("Varyantlarda kullanılan özellik silinemez.");
        context.ProductAttributes.Remove(attribute);
        await context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> Handle(DeleteAttributeValueCommand request, CancellationToken ct)
    {
        await using var transaction = await context.BeginTransactionAsync("catalog-attributes", ct);
        var value = await context.ProductAttributeValues.SingleOrDefaultAsync(v => v.Id == request.Id, ct) ?? throw new NotFoundException("Değer bulunamadı.");
        if (await context.ProductVariantAttributeValues.AnyAsync(v => v.ProductAttributeValueId == request.Id, ct))
            throw new ConflictException("Varyantlarda kullanılan değer silinemez.");
        context.ProductAttributeValues.Remove(value);
        await context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return Result<bool>.Success(true);
    }
}
