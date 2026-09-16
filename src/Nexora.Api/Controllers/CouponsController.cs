using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Common;
using Nexora.Application.Features.Coupons.Commands.CreateCoupon;
using Nexora.Application.Features.Coupons.Commands.DeleteCoupon;
using Nexora.Application.Features.Coupons.Commands.UpdateCoupon;
using Nexora.Application.Features.Coupons.Commands.UpdateCouponStatus;
using Nexora.Application.Features.Coupons.Dtos;
using Nexora.Application.Features.Coupons.Queries.GetAllCoupons;
using Nexora.Application.Features.Coupons.Queries.ValidateCoupon;

namespace Nexora.Api.Controllers;

public sealed class CouponsController : ApiControllerBase
{
    [HttpPost("validate")]
    public async Task<ActionResult<Result<CouponValidationResultDto>>> ValidateCoupon(
        ValidateCouponQuery query, 
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<IReadOnlyList<CouponDto>>>> GetAllCoupons(
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetAllCouponsQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<CouponDto>>> CreateCoupon(
        CreateCouponCommand command, 
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<CouponDto>>> UpdateCoupon(
        Guid id,
        UpdateCouponCommand command,
        CancellationToken cancellationToken = default)
    {
        if (id != command.Id)
        {
            return BadRequest(Result<CouponDto>.Failure("İstek kimliği ile kupon kimliği uyuşmuyor."));
        }

        var result = await Sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> UpdateCouponStatus(
        Guid id,
        bool isActive,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new UpdateCouponStatusCommand(id, isActive), cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<string>>> DeleteCoupon(
        Guid id, 
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new DeleteCouponCommand(id), cancellationToken);
        return Ok(result);
    }
}
