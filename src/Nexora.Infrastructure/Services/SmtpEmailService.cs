using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Nexora.Application.Abstractions;
using Nexora.Application.Features.Orders.Dtos;

namespace Nexora.Infrastructure.Services;

public sealed class SmtpEmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IOptions<EmailSettings> settings, ILogger<SmtpEmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(to))
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(_settings.Host) || string.IsNullOrWhiteSpace(_settings.UserName))
        {
            _logger.LogInformation(
                "[E-POSTA SİMÜLASYONU] Alıcı: {To} | Konu: {Subject} | Gönderici: {Sender}",
                to, subject, _settings.SenderEmail);
            return;
        }

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(_settings.SenderEmail, _settings.SenderName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(to);

            using var client = new SmtpClient(_settings.Host, _settings.Port)
            {
                EnableSsl = _settings.EnableSsl,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(_settings.UserName, _settings.Password),
                DeliveryMethod = SmtpDeliveryMethod.Network
            };

            await client.SendMailAsync(message, cancellationToken);
            _logger.LogInformation("E-posta başarıyla gönderildi: {To} | Konu: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "E-posta gönderilirken hata oluştu: {To} | Konu: {Subject}", to, subject);
        }
    }

    public async Task SendWelcomeEmailAsync(string to, string userName, CancellationToken cancellationToken = default)
    {
        var html = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }}
    .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }}
    .header {{ background: linear-gradient(135deg, #ea580c, #f97316); padding: 32px 24px; text-align: center; color: #ffffff; }}
    .content {{ padding: 32px 28px; color: #334155; line-height: 1.6; font-size: 14px; }}
    .button {{ display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: bold; font-size: 13px; margin-top: 18px; }}
    .footer {{ padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #f1f5f9; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h1 style='margin:0; font-size:24px; font-weight:800; letter-spacing:-0.5px;'>Nexora'ya Hoş Geldiniz!</h1>
    </div>
    <div class='content'>
      <p>Merhaba <strong>{userName}</strong>,</p>
      <p>Nexora ailesine katıldığınız için teşekkür ederiz. Hesabınız başarıyla oluşturuldu.</p>
      <p>Artık binlerce teknoloji, moda, yaşam ve ev kategorisindeki seçkin ürünleri güvenle keşfedebilir, sepete özel kupon fırsatlarından yararlanabilirsiniz.</p>
      <div style='text-align: center;'>
        <a href='http://localhost:5173' class='button'>Alışverişe Başla</a>
      </div>
    </div>
    <div class='footer'>
      © 2026 Nexora E-Ticaret Platformu. Tüm hakları saklıdır.
    </div>
  </div>
</body>
</html>";

        await SendEmailAsync(to, "Nexora'ya Hoş Geldiniz! 🎉", html, cancellationToken);
    }

    public async Task SendOrderConfirmationEmailAsync(OrderDto order, string to, string userName, CancellationToken cancellationToken = default)
    {
        var itemsRows = string.Join("", order.Items.Select(item => $@"
          <tr style='border-bottom: 1px solid #f1f5f9;'>
            <td style='padding: 12px 0; font-weight: 600; color: #1e293b;'>{item.ProductName} {(string.IsNullOrWhiteSpace(item.VariantSKU) ? "" : $"<br><span style='font-size:11px; color:#64748b; font-family:monospace;'>SKU: {item.VariantSKU}</span>")}</td>
            <td style='padding: 12px 0; text-align: center; color: #64748b;'>{item.Quantity} Adet</td>
            <td style='padding: 12px 0; text-align: right; font-weight: 700; color: #ea580c;'>{item.TotalPrice:N2} TL</td>
          </tr>
        "));

        var html = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }}
    .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }}
    .header {{ background: linear-gradient(135deg, #10b981, #059669); padding: 28px 24px; text-align: center; color: #ffffff; }}
    .content {{ padding: 28px; color: #334155; line-height: 1.6; font-size: 14px; }}
    .order-box {{ background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin: 18px 0; }}
    .footer {{ padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #f1f5f9; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h1 style='margin:0; font-size:22px; font-weight:800;'>Siparişiniz Alındı! ✅</h1>
      <p style='margin:4px 0 0 0; font-size:13px; opacity:0.95;'>Sipariş No: #{order.OrderNumber}</p>
    </div>
    <div class='content'>
      <p>Sayın <strong>{userName}</strong>,</p>
      <p>Siparişiniz başarıyla sistemimize ulaştı ve hazırlık sürecine alındı. Siparişinizin detayları aşağıda yer almaktadır:</p>
      
      <div class='order-box'>
        <p style='margin: 0 0 6px 0; font-size: 12px; color: #64748b;'><strong>Teslimat Adresi:</strong></p>
        <p style='margin: 0; font-size: 13px; color: #1e293b;'>{order.ShippingAddress}</p>
      </div>

      <table style='width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px;'>
        <thead>
          <tr style='border-bottom: 2px solid #e2e8f0; text-align: left; color: #64748b; font-size: 11px; text-transform: uppercase;'>
            <th style='padding-bottom: 8px;'>Ürün</th>
            <th style='padding-bottom: 8px; text-align: center;'>Adet</th>
            <th style='padding-bottom: 8px; text-align: right;'>Tutar</th>
          </tr>
        </thead>
        <tbody>
          {itemsRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan='2' style='padding-top: 14px; font-weight: bold; font-size: 15px; color: #0f172a;'>Toplam Tutar:</td>
            <td style='padding-top: 14px; text-align: right; font-weight: 800; font-size: 16px; color: #ea580c;'>{order.TotalAmount:N2} TL</td>
          </tr>
        </tfoot>
      </table>

      <div style='text-align: center; margin-top: 24px;'>
        <a href='http://localhost:5173/orders' style='display:inline-block; background-color:#ea580c; color:#fff; text-decoration:none; padding:12px 26px; border-radius:12px; font-weight:bold; font-size:13px;'>Siparişimi Takip Et</a>
      </div>
    </div>
    <div class='footer'>
      © 2026 Nexora E-Ticaret Platformu. Bizi tercih ettiğiniz için teşekkür ederiz.
    </div>
  </div>
</body>
</html>";

        await SendEmailAsync(to, $"Siparişiniz Alındı (#{order.OrderNumber}) 🛍️", html, cancellationToken);
    }

    public async Task SendOrderStatusChangedEmailAsync(
        string to,
        string userName,
        string orderNumber,
        string newStatusText,
        string? trackingNumber,
        string? carrier,
        CancellationToken cancellationToken = default)
    {
        var trackingSection = !string.IsNullOrWhiteSpace(trackingNumber)
            ? $@"<div style='background-color:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:14px; margin:16px 0; color:#1e40af;'>
                  <strong style='display:block; margin-bottom:4px;'>Kargo Takip Bilgileri:</strong>
                  Kargo Firması: <strong>{carrier ?? "Kargo"}</strong><br>
                  Takip Numarası: <strong style='font-family:monospace;'>{trackingNumber}</strong>
                </div>"
            : "";

        var isCancelled = string.Equals(newStatusText, "İptal Edildi", StringComparison.OrdinalIgnoreCase);
        var headerGradient = isCancelled
            ? "linear-gradient(135deg, #e11d48, #be123c)"
            : "linear-gradient(135deg, #2563eb, #3b82f6)";
        var headerTitle = isCancelled ? "Siparişiniz İptal Edildi" : "Sipariş Durumunuz Güncellendi 📦";
        var statusColor = isCancelled ? "#e11d48" : "#ea580c";
        var buttonBg = isCancelled ? "#e11d48" : "#2563eb";
        var emailSubject = isCancelled 
            ? $"Siparişiniz İptal Edildi (#{orderNumber})" 
            : $"Sipariş Durumu: {newStatusText} (#{orderNumber}) 📦";

        var html = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }}
    .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }}
    .header {{ background: {headerGradient}; padding: 28px 24px; text-align: center; color: #ffffff; }}
    .content {{ padding: 28px; color: #334155; line-height: 1.6; font-size: 14px; }}
    .footer {{ padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #f1f5f9; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h1 style='margin:0; font-size:22px; font-weight:800;'>{headerTitle}</h1>
      <p style='margin:4px 0 0 0; font-size:13px; opacity:0.95;'>Sipariş No: #{orderNumber}</p>
    </div>
    <div class='content'>
      <p>Sayın <strong>{userName}</strong>,</p>
      <p><strong>#{orderNumber}</strong> numaralı siparişinizin durumu <strong style='color:{statusColor}; font-size:15px;'>'{newStatusText}'</strong> olarak güncellenmiştir.</p>
      
      {trackingSection}

      <div style='text-align: center; margin-top: 24px;'>
        <a href='http://localhost:5173/orders' style='display:inline-block; background-color:{buttonBg}; color:#fff; text-decoration:none; padding:12px 26px; border-radius:12px; font-weight:bold; font-size:13px;'>Sipariş Detaylarını Gör</a>
      </div>
    </div>
    <div class='footer'>
      © 2026 Nexora E-Ticaret Platformu.
    </div>
  </div>
</body>
</html>";

        await SendEmailAsync(to, emailSubject, html, cancellationToken);
    }

    public async Task SendEmailVerificationCodeEmailAsync(string to, string userName, string verificationCode, CancellationToken cancellationToken = default)
    {
        var html = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }}
    .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }}
    .header {{ background: linear-gradient(135deg, #0284c7, #0ea5e9); padding: 32px 24px; text-align: center; color: #ffffff; }}
    .content {{ padding: 32px 28px; color: #334155; line-height: 1.6; font-size: 14px; text-align: center; }}
    .code-box {{ display: inline-block; background-color: #f0f9ff; border: 2px dashed #0284c7; border-radius: 16px; padding: 18px 36px; margin: 24px auto; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0284c7; font-family: 'Courier New', Courier, monospace; }}
    .footer {{ padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #f1f5f9; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h1 style='margin:0; font-size:24px; font-weight:800;'>E-Posta Doğrulama Kodu ✉️</h1>
    </div>
    <div class='content'>
      <p style='text-align: left;'>Merhaba <strong>{userName}</strong>,</p>
      <p style='text-align: left;'>Nexora'ya kaydolduğunuz için teşekkür ederiz. Hesabınızı güvenle aktifleştirmek için aşağıdaki 6 haneli doğrulama kodunu kullanabilirsiniz:</p>
      
      <div class='code-box'>
        {verificationCode}
      </div>

      <p style='font-size: 13px; color: #64748b; margin-top: 12px;'>Bu kod <strong>15 dakika</strong> boyunca geçerlidir.</p>
    </div>
    <div class='footer'>
      © 2026 Nexora E-Ticaret Platformu.
    </div>
  </div>
</body>
</html>";

        await SendEmailAsync(to, "Nexora E-Posta Doğrulama Kodunuz ✉️", html, cancellationToken);
    }

    public async Task SendPasswordResetCodeEmailAsync(string to, string userName, string resetCode, CancellationToken cancellationToken = default)
    {
        var html = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }}
    .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }}
    .header {{ background: linear-gradient(135deg, #ea580c, #f97316); padding: 32px 24px; text-align: center; color: #ffffff; }}
    .content {{ padding: 32px 28px; color: #334155; line-height: 1.6; font-size: 14px; text-align: center; }}
    .code-box {{ display: inline-block; background-color: #fff7ed; border: 2px dashed #ea580c; border-radius: 16px; padding: 18px 36px; margin: 24px auto; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #ea580c; font-family: 'Courier New', Courier, monospace; }}
    .footer {{ padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #f1f5f9; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h1 style='margin:0; font-size:24px; font-weight:800;'>Şifre Sıfırlama Kodu 🔐</h1>
    </div>
    <div class='content'>
      <p style='text-align: left;'>Merhaba <strong>{userName}</strong>,</p>
      <p style='text-align: left;'>Nexora hesabınız için bir şifre sıfırlama talebinde bulunuldu. Şifrenizi yenilemek için aşağıdaki 6 haneli doğrulama kodunu kullanabilirsiniz:</p>
      
      <div class='code-box'>
        {resetCode}
      </div>

      <p style='font-size: 13px; color: #64748b; margin-top: 12px;'>Bu kod <strong>15 dakika</strong> boyunca geçerlidir. Eğer şifre sıfırlama talebinde siz bulunmadıysanız bu e-postayı güvenle göz ardı edebilirsiniz.</p>
    </div>
    <div class='footer'>
      © 2026 Nexora E-Ticaret Platformu. Güvenliğiniz bizim için önemlidir.
    </div>
  </div>
</body>
</html>";

        await SendEmailAsync(to, "Nexora Şifre Sıfırlama Kodunuz 🔐", html, cancellationToken);
    }
}
