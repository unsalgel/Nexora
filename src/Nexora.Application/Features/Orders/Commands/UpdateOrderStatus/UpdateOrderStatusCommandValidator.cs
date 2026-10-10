using FluentValidation;

namespace Nexora.Application.Features.Orders.Commands.UpdateOrderStatus;

public sealed class UpdateOrderStatusCommandValidator : AbstractValidator<UpdateOrderStatusCommand>
{
    public UpdateOrderStatusCommandValidator()
    {
        RuleFor(x => x.OrderId).NotEmpty().WithMessage("Sipariş kimliği zorunludur.");
        RuleFor(x => x.NewStatus).IsInEnum().WithMessage("Geçersiz sipariş durumu.");
        RuleFor(x => x.TrackingNumber).MaximumLength(100).WithMessage("Takip numarası 100 karakteri aşamaz.");
        RuleFor(x => x.Carrier).MaximumLength(100).WithMessage("Kargo firması 100 karakteri aşamaz.");
    }
}
