using MediatR;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
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
        await using var transaction = await _context.BeginTransactionAsync($"usercart:{request.UserId}", cancellationToken);
        var requestHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new
        {
            request.ShippingAddress, request.BillingAddress, request.CouponCode, request.ExpectedTotalAmount
        }))));
        var idempotencyKey = request.IdempotencyKey?.Trim();
        if (!string.IsNullOrEmpty(idempotencyKey))
        {
            var previous = await _context.Orders.AsNoTracking().FirstOrDefaultAsync(
                o => o.UserId == request.UserId && o.IdempotencyKey == idempotencyKey, cancellationToken);
            if (previous is not null)
            {
                if (previous.RequestHash != requestHash || previous.PaymentToken is null)
                    throw new ConflictException("Aynı ödeme anahtarı farklı bir istek için kullanılamaz.");
                if (previous.PaymentStatus != PaymentStatus.Pending)
                    throw new ConflictException("Bu ödeme oturumunun sonucu siparişlerim ekranından kontrol edilmelidir.");
                return Result<PaymentInitializationResult>.Success(new(true, previous.PaymentToken, null,
                    previous.PaymentPageUrl, null, previous.OrderNumber));
            }
        }

        // Lock shared inventory before reading it; the URL is exposed only after the reservation commits.
        var productIds = await _context.CartItems.AsNoTracking().Where(i => i.Cart.UserId == request.UserId)
            .Select(i => i.ProductId).Distinct().ToListAsync(cancellationToken);
        foreach (var productId in productIds.Order())
            await transaction.AcquireLockAsync($"inventory:{productId}", cancellationToken);
        if (!string.IsNullOrWhiteSpace(request.CouponCode))
            await transaction.AcquireLockAsync($"coupon:{request.CouponCode.Trim().ToUpperInvariant()}", cancellationToken);

        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user is null)
            throw new NotFoundException("Kullanıcı bulunamadı.");
        if (!user.IsActive)
            throw new UnauthorizedException("Hesabınız dondurulmuştur.");

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
        var requestedQuantities = cart.Items.GroupBy(i => (i.ProductId, i.ProductVariantId))
            .ToDictionary(g => g.Key, g => g.Sum(i => i.Quantity));

        foreach (var item in cart.Items)
        {
            var quantity = item.Quantity;
            if (quantity <= 0 || item.Product.Price <= 0 || !item.Product.IsActive || item.Product.IsDeleted)
                throw new ConflictException("Sepette satışa uygun olmayan ürün var.");
            if (item.ProductVariantId.HasValue && (item.ProductVariant is null ||
                item.ProductVariant.ProductId != item.ProductId || item.ProductVariant.Price <= 0 ||
                !item.ProductVariant.IsActive || item.ProductVariant.IsDeleted))
                throw new ConflictException("Sepette satışa uygun olmayan ürün varyantı var.");
            if (item.ProductVariantId.HasValue && item.ProductVariant is not null)
            {
                if (item.ProductVariant.StockQuantity < requestedQuantities[(item.ProductId, item.ProductVariantId)])
                    throw new ConflictException($"'{item.Product.Name} ({item.ProductVariant.SKU})' için yetersiz stok! Mevcut: {item.ProductVariant.StockQuantity}");

                var itemTotal = item.ProductVariant.Price * quantity;
                rawTotal += itemTotal;

                orderItems.Add(new OrderItem
                {
                    SourceCartItemId = item.Id,
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
                if (item.Product.StockQuantity < requestedQuantities[(item.ProductId, item.ProductVariantId)])
                    throw new ConflictException($"'{item.Product.Name}' için yetersiz stok! Mevcut: {item.Product.StockQuantity}");

                var itemTotal = item.Product.Price * quantity;
                rawTotal += itemTotal;

                orderItems.Add(new OrderItem
                {
                    SourceCartItemId = item.Id,
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
        if (grandTotal <= 0)
            throw new BusinessValidationException("Ödenecek tutar sıfırdan büyük olmalıdır.");

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
            IpAddress: request.IpAddress ?? "127.0.0.1");

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
        if (string.IsNullOrWhiteSpace(initResult.Token) || initResult.Token.Length > 128 || string.IsNullOrWhiteSpace(initResult.PaymentPageUrl))
            return Result<PaymentInitializationResult>.Failure("Ödeme sağlayıcısı geçerli bir oturum döndürmedi.");

        foreach (var item in cart.Items)
        {
            if (item.ProductVariantId.HasValue) item.ProductVariant!.StockQuantity -= item.Quantity;
            else item.Product.StockQuantity -= item.Quantity;
        }
        if (pricing.Coupon is not null) pricing.Coupon.ReservedUsageCount++;

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
            IdempotencyKey = idempotencyKey,
            RequestHash = requestHash,
            PaymentToken = initResult.Token,
            PaymentPageUrl = initResult.PaymentPageUrl,
            NextPaymentCheckAtUtc = DateTime.UtcNow.AddMinutes(2),
            StockReserved = true,
            ReservedCouponId = pricing.Coupon?.Id,
            Items = orderItems
        };

        _context.Orders.Add(pendingOrder);
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Result<PaymentInitializationResult>.Success(initResult with { CheckoutFormContent = null, OrderNumber = orderNumber }, "Ödeme oturumu başarıyla oluşturuldu.");
    }
}
