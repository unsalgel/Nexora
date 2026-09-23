using Microsoft.Extensions.Logging;
using Nexora.Application.Abstractions;

namespace Nexora.Application.Common.Extensions;

public static class EmailServiceExtensions
{
    public static void SendInBackground(
        this IEmailService emailService,
        Func<IEmailService, Task> sendAction,
        ILogger logger,
        string errorMessage,
        params object?[] logArgs)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                await sendAction(emailService);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, errorMessage, logArgs);
            }
        });
    }
}
