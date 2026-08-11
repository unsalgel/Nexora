namespace Nexora.Application.Features.Categories.Dtos;

public sealed record CategoryDto(
    Guid Id,
    string Name,
    string? Description,
    Guid? ParentCategoryId,
    string? ParentCategoryName,
    bool IsActive,
    List<CategoryDto>? SubCategories);
