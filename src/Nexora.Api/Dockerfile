FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

COPY ["src/Nexora.Domain/Nexora.Domain.csproj", "src/Nexora.Domain/"]
COPY ["src/Nexora.Application/Nexora.Application.csproj", "src/Nexora.Application/"]
COPY ["src/Nexora.Persistence/Nexora.Persistence.csproj", "src/Nexora.Persistence/"]
COPY ["src/Nexora.Infrastructure/Nexora.Infrastructure.csproj", "src/Nexora.Infrastructure/"]
COPY ["src/Nexora.Api/Nexora.Api.csproj", "src/Nexora.Api/"]

RUN dotnet restore "src/Nexora.Api/Nexora.Api.csproj"

COPY ["src/", "src/"]
WORKDIR "/src/src/Nexora.Api"
RUN dotnet publish "Nexora.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS final
WORKDIR /app

RUN apk add --no-cache tzdata icu-libs && \
    mkdir -p /app/logs /app/wwwroot/uploads/products /app/data/keys && \
    chown -R $APP_UID:$APP_UID /app/logs /app/wwwroot /app/data

ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

USER $APP_UID

COPY --from=build --chown=$APP_UID:$APP_UID /app/publish .
COPY --chown=$APP_UID:$APP_UID ["licenses/SkiaSharp/", "/app/licenses/SkiaSharp/"]

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health/live || exit 1

ENTRYPOINT ["dotnet", "Nexora.Api.dll"]
