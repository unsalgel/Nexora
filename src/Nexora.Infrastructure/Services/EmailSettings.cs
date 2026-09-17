namespace Nexora.Infrastructure.Services;

public sealed class EmailSettings
{
    public const string SectionName = "EmailSettings";

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = "noreply@nexora.com";
    public string SenderName { get; set; } = "Nexora E-Ticaret";
}
