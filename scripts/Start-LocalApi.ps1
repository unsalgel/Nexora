param([string]$EnvFile = (Join-Path $PSScriptRoot '..\.env'))

$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (-not (Test-Path -LiteralPath $EnvFile -PathType Leaf)) { throw '.env dosyası bulunamadı; README yerel kurulum bölümündeki alanlarla depo kökünde oluşturun.' }
foreach ($line in Get-Content -LiteralPath $EnvFile) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
        $name = $Matches[1]
        $value = $Matches[2].Trim()
        if ($value.StartsWith('"') -and $value.EndsWith('"')) { $value = $value.Substring(1, $value.Length - 2) }
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}
foreach ($name in @('DB_PASSWORD', 'REDIS_PASSWORD', 'JWT_SECRET_KEY', 'ADMIN_SEED_PASSWORD')) {
    $value = [Environment]::GetEnvironmentVariable($name, 'Process')
    if ([string]::IsNullOrWhiteSpace($value) -or $value.StartsWith('CHANGE_ME')) { throw "Yerel yapılandırmada $name için gerçek geliştirme değeri gerekli." }
}
function Quote-ConnectionValue([string]$value) { return '"' + $value.Replace('"', '""') + '"' }
$dbUser = if ($env:DB_USER) { $env:DB_USER } else { 'postgres' }
$dbName = if ($env:DB_NAME) { $env:DB_NAME } else { 'NexoraDb' }
$env:ConnectionStrings__DefaultConnection = 'Host=localhost;Port=5432;Database=' + (Quote-ConnectionValue $dbName) + ';Username=' + (Quote-ConnectionValue $dbUser) + ';Password=' + (Quote-ConnectionValue $env:DB_PASSWORD)
$redisPort = if ($env:REDIS_PORT) { $env:REDIS_PORT } else { '6379' }
$env:ConnectionStrings__Redis = "127.0.0.1:$redisPort,abortConnect=false"
$env:DataProtection__KeysPath = Join-Path $projectRoot '.local\keys'
$env:ASPNETCORE_ENVIRONMENT = 'Development'
& dotnet run --project (Join-Path $projectRoot 'src\Nexora.Api')
exit $LASTEXITCODE
