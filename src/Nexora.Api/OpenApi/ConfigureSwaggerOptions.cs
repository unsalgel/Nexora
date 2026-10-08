using Asp.Versioning.ApiExplorer;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Nexora.Api.OpenApi;

// Swagger dokümantasyonunu API sürümlerine göre dinamik olarak yapılandırır
public sealed class ConfigureSwaggerOptions : IConfigureOptions<SwaggerGenOptions>
{
    private readonly IApiVersionDescriptionProvider _provider;

    public ConfigureSwaggerOptions(IApiVersionDescriptionProvider provider)
    {
        _provider = provider;
    }

    public void Configure(SwaggerGenOptions options)
    {
        foreach (var description in _provider.ApiVersionDescriptions)
        {
            var info = new OpenApiInfo
            {
                Title = "Nexora API",
                Version = description.ApiVersion.ToString(),
                Description = description.IsDeprecated
                    ? "Bu API sürümü kullanımdan kaldırılmıştır (Deprecated)."
                    : "Nexora E-Ticaret Platformu REST API Dokümantasyonu"
            };

            options.SwaggerDoc(description.GroupName, info);
        }
    }
}
