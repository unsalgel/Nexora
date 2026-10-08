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

USER $APP_UID

COPY --from=build --chown=$APP_UID:$APP_UID /app/publish .

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health/live || exit 1

ENTRYPOINT ["dotnet", "Nexora.Api.dll"]
