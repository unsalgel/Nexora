using MediatR;
using Nexora.Application.Common;
using Nexora.Application.Features.Products.Dtos;

namespace Nexora.Application.Features.Products.Queries.GetProducts;

public sealed record GetProductsQuery(
    int Page = 1,
    int PageSize = 20,
    Guid? CategoryId = null,
    Guid? BrandId = null,
    string? SearchTerm = null) : IRequest<Result<PagedResult<ProductListDto>>>;
