using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Abstractions;
using Nexora.Application.Common;
using Nexora.Application.Features.Chat.Dtos;

namespace Nexora.Application.Features.Chat.Commands.SendMessage;

/// <summary>
/// Müşteri destek mesajını karşılayan ve RAG (Retrieval-Augmented Generation)
/// mantığıyla veritabanındaki ürünleri Gemini modeline bağlam olarak besleyen handler.
/// </summary>
public sealed class SendChatMessageCommandHandler : IRequestHandler<SendChatMessageCommand, Result<ChatResponseDto>>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IAiChatService _aiChatService;


    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "merhaba", "selam", "iyi", "gunler", "günler", "aksamlar", "akşamlar",
        "ben", "sen", "biz", "siz", "bir", "bu", "su", "şu", "o",
        "var", "yok", "mi", "mı", "mu", "mü", "misin", "mısın", "musun", "müsün",
        "icin", "için", "ile", "ve", "veya", "da", "de", "olan", "olarak",
        "ariyorum", "arıyorum", "istiyorum", "bakar", "bakarmisin", "bakarmısın",
        "fiyat", "fiyati", "fiyatı", "nedir", "ne", "kadar", "lutfen", "lütfen",
        "paylasabilir", "paylaşabilir", "link", "linki", "linkini", "mevcut",
        "bana", "listeler", "listele", "oner", "öner", "onerir", "önerir", "misiniz"
    };

    public SendChatMessageCommandHandler(
        IApplicationDbContext dbContext,
        IAiChatService aiChatService)
    {
        _dbContext = dbContext;
        _aiChatService = aiChatService;
    }

    public async Task<Result<ChatResponseDto>> Handle(
        SendChatMessageCommand request,
        CancellationToken cancellationToken)
    {
        var keywords = ExtractKeywords(request.Message);
        var relevantProducts = await GetRelevantProductsAsync(keywords, cancellationToken);

        var systemPrompt = BuildSystemPrompt(relevantProducts);
        var userPrompt = BuildUserPrompt(request.Message, request.History);

        var aiReply = await _aiChatService.GenerateResponseAsync(systemPrompt, userPrompt, cancellationToken);

        aiReply = AppendProductCardsIfMissing(aiReply, relevantProducts);

        return Result<ChatResponseDto>.Success(new ChatResponseDto(aiReply));
    }

    private static string AppendProductCardsIfMissing(string aiReply, List<ProductInfo> products)
    {
        if (products is { Count: 0 } || aiReply.Contains("[PRODUCT_CARD|"))
        {
            return aiReply;
        }

        // Yanıtta adı geçen ürünleri tespit et
        var mentionedProducts = products
            .Where(p => aiReply.Contains(p.Name, StringComparison.OrdinalIgnoreCase) ||
                        p.Name.Split(' ').Any(word => word.Length > 3 && aiReply.Contains(word, StringComparison.OrdinalIgnoreCase)))
            .Take(3)
            .ToList();

        if (mentionedProducts.Count == 0 && products.Count > 0)
        {
            mentionedProducts = products.Take(1).ToList();
        }

        var sb = new StringBuilder(aiReply);
        sb.AppendLine();
        sb.AppendLine();
        foreach (var p in mentionedProducts)
        {
            var img = string.IsNullOrWhiteSpace(p.ImageUrl) ? "none" : p.ImageUrl;
            sb.AppendLine($"[PRODUCT_CARD|{p.Id}|{p.Name}|{p.Price:N2} TL|{img}]");
        }

        return sb.ToString().TrimEnd();
    }

    private static List<string> ExtractKeywords(string message) =>
        message.Split(new[] { ' ', ',', '.', '?', '!', ':', ';', '\'', '"' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(w => w.ToLower().Trim())
            .Where(w => w.Length > 2 && !StopWords.Contains(w))
            .Distinct()
            .ToList();

    private async Task<List<ProductInfo>> GetRelevantProductsAsync(
        List<string> keywords,
        CancellationToken cancellationToken)
    {
        var baseQuery = _dbContext.Products
            .AsNoTracking()
            .Where(p => p.IsActive && !p.IsDeleted);

        List<ProductInfo> products = new();

        if (keywords is { Count: > 0 })
        {
            var k1 = keywords.ElementAtOrDefault(0);
            var k2 = keywords.ElementAtOrDefault(1);
            var k3 = keywords.ElementAtOrDefault(2);

            var matchedQuery = baseQuery.Where(p =>
                (k1 != null && (EF.Functions.Like(p.Name.ToLower(), "%" + k1 + "%") || (p.Category != null && EF.Functions.Like(p.Category.Name.ToLower(), "%" + k1 + "%")))) ||
                (k2 != null && (EF.Functions.Like(p.Name.ToLower(), "%" + k2 + "%") || (p.Category != null && EF.Functions.Like(p.Category.Name.ToLower(), "%" + k2 + "%")))) ||
                (k3 != null && (EF.Functions.Like(p.Name.ToLower(), "%" + k3 + "%") || (p.Category != null && EF.Functions.Like(p.Category.Name.ToLower(), "%" + k3 + "%")))));

            products = await ProjectToProductInfo(matchedQuery)
                .Take(10)
                .ToListAsync(cancellationToken);
        }

        if (products is { Count: 0 })
        {
            products = await ProjectToProductInfo(
                    baseQuery.OrderByDescending(p => p.CreatedAtUtc))
                .Take(10)
                .ToListAsync(cancellationToken);
        }

        return products;
    }

    /// <summary>
    /// Tekrar eden Select projeksiyonunu tek noktada tanımlar (DRY).
    /// </summary>
    private static IQueryable<ProductInfo> ProjectToProductInfo(IQueryable<Domain.Entities.Product> query)
    {
        return query.Select(p => new ProductInfo(
            p.Id,
            p.Name,
            p.Price,
            p.StockQuantity,
            p.Category != null ? p.Category.Name : "Genel",
            p.Images.OrderByDescending(i => i.IsMain).Select(i => i.ImageUrl).FirstOrDefault() ?? ""));
    }

    private static string BuildSystemPrompt(List<ProductInfo> products)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Sen Nexora E-Ticaret platformunun müşteri destek yapay zeka asistanısın.");
        sb.AppendLine("GÖREVİN: Müşterilere mağazadaki ürünler hakkında bilgi vermek ve ürün kartlarını mutlaka cevabına eklemek.");
        sb.AppendLine("KURALLAR:");
        sb.AppendLine("1. Kesinlikle uydurma ürün veya fiyat bilgisi verme. Yalnızca aşağıda verilen gerçek mağaza verilerine dayan.");
        sb.AppendLine("2. Bahsettiğin her ürün için cevabının EN ALTINA mutlaka şu etiketi yaz:");
        sb.AppendLine("   [PRODUCT_CARD|ID|URUN_ADI|FIYAT|RESIM_URL]");
        sb.AppendLine("   (RESIM_URL aşağıda ne verildiyse aynen kopyala, boşsa 'none' yaz).");
        sb.AppendLine("3. Yanıtların Türkçe, samimi ve öz olsun.");
        sb.AppendLine();
        sb.AppendLine("--- MAĞAZADAKİ GÜNCEL ÜRÜN BİLGİLERİ ---");

        if (products is { Count: > 0 })
        {
            foreach (var p in products)
            {
                var stockStatus = p.StockQuantity > 0 ? $"Stokta var ({p.StockQuantity} adet)" : "Tükendi";
                var imgUrl = string.IsNullOrWhiteSpace(p.ImageUrl) ? "none" : p.ImageUrl;
                sb.AppendLine($"- ID: {p.Id} | Ürün: {p.Name} | Fiyat: {p.Price:N2} TL | Durum: {stockStatus} | Resim: {imgUrl}");
            }
        }
        else
        {
            sb.AppendLine("Katalogda şu an aktif ürün bulunamadı.");
        }

        return sb.ToString();
    }

    private static string BuildUserPrompt(string userQuery, List<ChatMessageItemDto>? history)
    {
        var sb = new StringBuilder();
        if (history is { Count: > 0 })
        {
            sb.AppendLine("Geçmiş Konuşma:");
            foreach (var item in history.TakeLast(3))
            {
                sb.AppendLine($"{item.Role}: {item.Content}");
            }
            sb.AppendLine();
        }
        sb.AppendLine($"Müşteri: {userQuery}");
        return sb.ToString();
    }

    /// <summary>
    /// RAG projeksiyonunda kullanılan dahili veri taşıyıcı.
    /// </summary>
    private sealed record ProductInfo(Guid Id, string Name, decimal Price, int StockQuantity, string CategoryName, string ImageUrl);
}