# Nexora

Nexora, geliştirdiğim bir e-ticaret hobi projesi. Müşteriler için alışveriş sitesi, mağaza yönetimi için ayrı bir panel ve ASP.NET Core ile hazırlanmış bir API içeriyor. Ödemelerde iyzico kullanıyorum.

## Teknolojiler ve sürümler

| Bileşen | Mevcut sürüm |
|---|---|
| .NET / ASP.NET Core | 8 (`net8.0`) |
| EF Core / Npgsql sağlayıcısı | 8.x |
| PostgreSQL / Redis konteynerleri | 16 / 7 |
| iyzico .NET SDK (`Iyzipay`) | 2.1.80 |
| React | 19.2.8 |
| TypeScript | 6.0.3 |
| Vite | 8.3.5 |
| Tailwind CSS | 4.3.3 |
| React Router | 7.18.2 |
| TanStack React Query | 5.101.4 |
| CI Node.js | 24 |

Uygulama belgeleri: [müşteri vitrini](src/Nexora.Web/README.md), [yönetim paneli](src/Nexora.Admin/README.md).

## Projede neler var?

Alışveriş sitesinde ürünleri inceleyebilir, sepete ekleyebilir, kupon kullanabilir ve sipariş verebilirsiniz. Hesap bölümünde adresler, favoriler ve geçmiş siparişler yer alır.

Yönetim panelinden ürün, stok, sipariş, kupon ve kullanıcı işlemleri yapılır.

## Yerel kurulum

Projeyi bilgisayarınızda çalıştırmak için .NET 8 SDK, Node.js, npm ve Docker Desktop gerekir. Projenin otomatik kontrollerinde Node.js 24 kullanılır.

Yerel kurulum için depo kökünde `.env` dosyası oluşturun. Mevcut dosyanız varsa içindeki değerleri düzenleyin:

```powershell
if (-not (Test-Path .env)) { New-Item -ItemType File .env }
```

Bu dosyada `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `REDIS_PASSWORD`, `PGADMIN_EMAIL`, `PGADMIN_PASSWORD`, `JWT_SECRET_KEY`, `ADMIN_SEED_EMAIL` ve `ADMIN_SEED_PASSWORD` alanlarını `AD=değer` biçiminde tanımlayın. JWT için en az 32 rastgele byte'tan üretilmiş bir anahtar kullanın. Ödeme ayarları `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL` ve `IYZICO_CALLBACK_URL` alanlarıyla yapılandırılır; ayrıntılar [ödeme belgesinde](docs/iyzico-payments.md) bulunur. Gerçek anahtarları frontend'e veya README'ye yazmayın.

`.env` ve `.env.*` dosyaları Git ve Docker build kapsamı dışındadır. `docker compose` `.env` dosyasını otomatik okur; **`dotnet run` otomatik okumaz**.

Redis'in yerel portu varsayılan olarak `6379`'dur. Port kullanılamıyorsa `.env` içine `REDIS_PORT=16379` gibi uygun bir port yazabilirsiniz; Compose ve yerel API başlatma betiği aynı değeri kullanır. Redis yine yalnız `127.0.0.1` üzerinde yayınlanır.

```powershell
docker compose up -d
dotnet restore Nexora.sln
./scripts/Start-LocalApi.ps1
```

`Start-LocalApi.ps1`, `.env` dosyasındaki ayarları okuyarak API'yi geliştirme ortamında başlatır.

Geliştirme ortamında veritabanı tabloları ve örnek ürünler otomatik oluşturulur. İlk yönetici hesabı `.env` dosyasındaki `ADMIN_SEED_EMAIL` ve `ADMIN_SEED_PASSWORD` değerleriyle hazırlanır. API'yi Docker içinde çalıştırmak için şu komut da kullanılabilir:

```powershell
docker compose --profile app up --build -d
```

API adresi `http://localhost:5285`, API dokümantasyonu `http://localhost:5285/swagger`, pgAdmin adresi ise `http://localhost:5050`'dir. PostgreSQL `5432`, Redis ise `.env` içinde değiştirilmediyse `6379` portunu kullanır. Bu Docker kurulumu yerel geliştirme içindir.

Müşteri vitrinini ve yönetim panelini depo kökünden açılan ayrı terminallerde başlatın:

```powershell
cd src/Nexora.Web
npm ci
npm run dev
```

```powershell
cd src/Nexora.Admin
npm ci
npm run dev
```

Vitrin portu 5173, admin portu 5174'tür. API varsayılan portu 5285'tir. Adresleri değiştirmek için ilgili frontend'in `.env.local` dosyasına `VITE_API_URL=http://localhost:5285/api/v1` ve `VITE_BACKEND_URL=http://localhost:5285` yazın. `VITE_` ile başlayan ayarlar tarayıcıda görülebilir; bu alanlara parola veya API anahtarı yazmayın.

E-posta göndermek için `.env` dosyasındaki `EmailSettings__...` ayarlarını doldurun. SMTP sunucusu ve kullanıcı adı boşsa geliştirme ortamında gerçek e-posta gönderilmez. `Frontend__BaseUrl`, e-postalardaki bağlantılar ve ödeme sonrası dönüş için alışveriş sitesinin adresini belirtir.

## Ödeme

Ödeme ekranında teslimat adresi seçilir ve iyzico'nun ödeme sayfasına geçilir. Kart bilgileri bu sayfada girilir. İşlemden sonra kullanıcı tekrar alışveriş sitesine döner ve ödeme sonucunu görür.

İyzico ayarları backend tarafındaki `.env` dosyasına yazılır. Kurulum ayrıntıları [ödeme belgesinde](docs/iyzico-payments.md) bulunur. Panelden otomatik iade işlemi yapılamaz.

## Testleri çalıştırma

Backend testlerini proje klasöründe çalıştırabilirsiniz:

```powershell
dotnet test Nexora.sln
```

Alışveriş sitesi veya yönetim panelinin klasöründe:

```bash
npm test
```

Veritabanı ve Redis kullanan entegrasyon testleri ayrıca test ortamı ayarları gerektirir.

## Anahtarlar ve parolalar

Yerel ayarlar `.env` dosyasında tutulur. Bu dosya GitHub'a gönderilmez. API anahtarlarını ve parolaları kodun veya README dosyalarının içine yazmayın.

Lisans bilgisi [LICENSE](LICENSE) dosyasında yer alır.
