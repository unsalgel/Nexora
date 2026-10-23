using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Cart;
using Nexora.Application.Features.Payments.Dtos;
using Nexora.Domain.Entities;
using Nexora.Domain.Enums;
using Nexora.Domain.Exceptions;

namespace Nexora.Application.Features.Payments.Commands.InitializePayment;

public sealed class InitializePaymentCommandHandler : IRequestHandler<InitializePaymentCommand, Result<PaymentInitializationResult>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPaymentGateway _paymentGateway;

    public InitializePaymentCommandHandler(IApplicationDbContext context, IPaymentGateway paymentGateway)
    {
        _context = context;
        _paymentGateway = paymentGateway;
    }

    public async Task<Result<PaymentInitializationResult>> Handle(InitializePaymentCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user is null)
            throw new NotFoundException("Kullanıcı bulunamadı.");

        var cart = await _context.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Category)
            .Include(c => c.Items)
                .ThenInclude(i => i.ProductVariant)
            .FirstOrDefaultAsync(c => c.UserId == request.UserId, cancellationToken);

        if (cart is null || !cart.Items.Any())
            throw new BusinessValidationException("Sepetinizde ürün bulunmamaktadır.");

        var orderItems = new List<OrderItem>();
        decimal rawTotal = 0;

        foreach (var item in cart.Items)
        {
            var quantity = item.Quantity;
            if (item.ProductVariantId.HasValue && item.ProductVariant is not null)
            {
                if (item.ProductVariant.StockQuantity < quantity)
                    throw new ConflictException($"'{item.Product.Name} ({item.ProductVariant.SKU})' için yetersiz stok! Mevcut: {item.ProductVariant.StockQuantity}");

                var itemTotal = item.ProductVariant.Price * quantity;
                rawTotal += itemTotal;

                orderItems.Add(new OrderItem
                {
                    ProductId = item.ProductId,
                    ProductName = item.Product.Name,
                    ProductVariantId = item.ProductVariantId,
                    VariantSKU = item.ProductVariant.SKU,
                    UnitPrice = item.ProductVariant.Price,
                    Quantity = quantity,
                    TotalPrice = itemTotal
                });
            }
            else
            {
                if (item.Product.StockQuantity < quantity)
                    throw new ConflictException($"'{item.Product.Name}' için yetersiz stok! Mevcut: {item.Product.StockQuantity}");

                var itemTotal = item.Product.Price * quantity;
                rawTotal += itemTotal;

                orderItems.Add(new OrderItem
                {
                    ProductId = item.ProductId,
                    ProductName = item.Product.Name,
                    UnitPrice = item.Product.Price,
                    Quantity = quantity,
                    TotalPrice = itemTotal
                });
            }
        }

        var pricing = await CartPricing.CalculateAsync(_context, rawTotal, request.CouponCode, cancellationToken);
        var grandTotal = pricing.Quote.TotalAmount;

        if (request.ExpectedTotalAmount.HasValue && request.ExpectedTotalAmount.Value != grandTotal)
            throw new ConflictException("Sepet toplamı değişti. Güncel tutarı kontrol edip tekrar onaylayınız.");

        var orderNumber = $"NX-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";

        var basketItems = new List<PaymentBasketItemDto>();
        decimal runningTotal = 0;

        for (int i = 0; i < orderItems.Count; i++)
        {
            var item = orderItems[i];
            var itemRatio = rawTotal > 0 ? (item.TotalPrice / rawTotal) : 0;
            var discountedItemTotal = Math.Round(pricing.Quote.Subtotal * itemRatio - (pricing.Quote.DiscountAmount * itemRatio), 2);
            if (discountedItemTotal < 0.01m) discountedItemTotal = 0.01m;

            if (i == orderItems.Count - 1 && pricing.Quote.ShippingFee == 0)
            {
                discountedItemTotal = grandTotal - runningTotal;
            }
            runningTotal += discountedItemTotal;

            basketItems.Add(new PaymentBasketItemDto(
                Id: item.ProductId?.ToString() ?? Guid.NewGuid().ToString(),
                Name: item.ProductName,
                Category: "Genel",
                Price: discountedItemTotal));
        }

        if (pricing.Quote.ShippingFee > 0)
        {
            var shippingItemPrice = grandTotal - runningTotal;
            basketItems.Add(new PaymentBasketItemDto(
                Id: Guid.NewGuid().ToString(),
                Name: "Kargo ve Teslimat",
                Category: "Kargo",
                Price: shippingItemPrice));
        }

        var buyer = new PaymentBuyerDto(
            Id: user.Id.ToString(),
            Name: user.FirstName,
            Surname: user.LastName,
            Email: user.Email,
            PhoneNumber: "+905555555555",
            IdentityNumber: "11111111111",
            RegistrationAddress: request.ShippingAddress,
            City: "Istanbul",
            Country: "Turkey",
            ZipCode: "34000",
            IpAddress: "127.0.0.1");

        var address = new PaymentAddressDto(
            ContactName: $"{user.FirstName} {user.LastName}",
            City: "Istanbul",
            Country: "Turkey",
            AddressLine: request.ShippingAddress,
            ZipCode: "34000");

        var billingAddress = string.IsNullOrWhiteSpace(request.BillingAddress) ? address : new PaymentAddressDto(
            ContactName: $"{user.FirstName} {user.LastName}",
            City: "Istanbul",
            Country: "Turkey",
            AddressLine: request.BillingAddress,
            ZipCode: "34000");

        var initRequest = new PaymentInitializationRequest(
            OrderNumber: orderNumber,
            TotalAmount: grandTotal,
            CallbackUrl: string.Empty,
            Buyer: buyer,
            ShippingAddress: address,
            BillingAddress: billingAddress,
            BasketItems: basketItems);

        var initResult = await _paymentGateway.InitializePaymentAsync(initRequest, cancellationToken);
        if (!initResult.IsSuccess)
            return Result<PaymentInitializationResult>.Failure(initResult.ErrorMessage ?? "Ödeme başlatılamadı.");

        var pendingOrder = new Order
        {
            OrderNumber = orderNumber,
            UserId = request.UserId,
            ShippingAddress = request.ShippingAddress,
            TotalAmount = grandTotal,
            Subtotal = pricing.Quote.Subtotal,
            DiscountAmount = pricing.Quote.DiscountAmount,
            ShippingFee = pricing.Quote.ShippingFee,
            CouponCode = pricing.Quote.CouponCode,
            Status = OrderStatus.Pending,
            PaymentStatus = PaymentStatus.Pending,
            IdempotencyKey = initResult.Token,
            Items = orderItems
        };

        _context.Orders.Add(pendingOrder);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<PaymentInitializationResult>.Success(initResult, "Ödeme oturumu başarıyla oluşturuldu.");
    }
}
