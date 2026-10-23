# Nexora

Nexora, geliştirdiğim MIT lisanslı bir e-ticaret hobi projesi. ASP.NET Core API'yi, müşteri vitrinini ve yönetim panelini aynı depoda tutuyorum. Ödeme entegrasyonunda iyzico Checkout Form kullanıyorum; eski sahte ödeme servisini ve doğrudan kart girişini kaldırdım.

## Kullandığım sürümler

Projede kullandığım sürümleri aşağıda listeledim. Backend için proje dosyalarını, frontend için iki uygulamanın `package-lock.json` kayıtlarını esas aldım.

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

## Mimari ve kapsam

Projeyi şu katmanlara ayırdım:

- `Nexora.Domain`: entity'ler ve iş kuralı tipleri.
- `Nexora.Application`: MediatR CQRS, FluentValidation, DTO ve altyapı portları.
- `Nexora.Persistence`: PostgreSQL/EF Core, migration, indeks ve transaction kilitleri.
- `Nexora.Infrastructure`: auth/cache, SMTP outbox, iyzico adaptörü, arka plan işleri ve dosya depolama.
- `Nexora.Api`: HTTP/SignalR, middleware ve DI composition root.
- `Nexora.Web` / `Nexora.Admin`: React, TypeScript, Vite ve TanStack Query.

Katalog ve varyantlardan sepet, sipariş, kupon, değerlendirme, adres, kullanıcı/rol ve site ayarlarına kadar alışverişin temel akışlarını bu yapıda topladım. Domain/Application bağımlılık yönünü NetArchTest ile kontrol ediyorum. İş kuralları için de regresyon testleri ve gerçek PostgreSQL/Redis entegrasyon testleri kullanıyorum.

Kimlik doğrulamada JWT; yetkilendirme, oturum iptali, IP sınırları ve güvenlik başlıkları için sunucu tarafı kontroller kullanıyorum. Eşzamanlı işlemlerde EF `xmin` ve transaction kilitlerinden yararlanıyorum. Realtime olayları arayüz güncellemesi için kullanıyor, asıl veriyi HTTP sorgularından alıyorum. E-postaları iş verisiyle aynı commit'te outbox'a yazıp Hangfire üzerinden gönderiyorum.

AI asistanına yalnız herkese açık katalog bağlamını veriyorum. API'de mesaj ve geçmiş boyutlarını sınırlıyorum; asistanın özel verilere veya yetkili araçlara erişimi yok. XML etiketlerini ve prompt talimatlarını yanıtları yönlendirmek için kullanıyorum, bunları tek başına bir güvenlik garantisi saymıyorum.

Görsel yüklemelerinde JPG, PNG ve WebP dosyalarını decode edip yeniden encode ediyorum. Girdi ve çıktı için 5 MiB, boyut için 4096 piksel ve toplam 16 milyon piksel sınırı var; animasyon kabul edilmiyor. Dosyalara GUID adları veriyor, kullanılmayan görselleri referans ve dosya yolu kontrolüyle temizliyorum.

## Yerel kurulum

Gereksinimler: .NET 8 SDK veya `net8.0` hedefini destekleyen bir SDK, Node.js (CI: 24), npm ve altyapı için Docker Desktop. Paketler depodaki NuGet yapılandırması ve npm kilit dosyalarına göre yüklenir.

Yerel kurulumda depo kökünde bir `.env` dosyası kullanıyorum. Dosya yoksa PowerShell ile oluşturabilirsin:

```powershell
if (-not (Test-Path .env)) { New-Item -ItemType File .env }
```

Bu dosyada `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `REDIS_PASSWORD`, `PGADMIN_EMAIL`, `PGADMIN_PASSWORD`, `JWT_SECRET_KEY`, `ADMIN_SEED_EMAIL` ve `ADMIN_SEED_PASSWORD` alanlarını `AD=değer` biçiminde tutuyorum. Kendi kurulumunda JWT için en az 32 rastgele byte'tan üretilmiş bir anahtar kullan. Ödeme ayarları `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL` ve `IYZICO_CALLBACK_URL` alanlarından geliyor; ayrıntıları [ödeme belgesinde](docs/iyzico-payments.md) anlattım. Gerçek anahtarları frontend'e veya README'ye yazmıyorum.

Gerçek `.env` ve `.env.*` dosyalarını Git ve Docker build kapsamı dışında tutuyorum. `docker compose` `.env` dosyasını otomatik okur; **`dotnet run` otomatik okumaz**. Mevcut `.env` dosyan varsa yeniden oluşturmak yerine içindeki alanları düzenleyebilirsin.

Redis'in yerel portu varsayılan olarak `6379`'dur. Port kullanılamıyorsa `.env` içine `REDIS_PORT=16379` gibi uygun bir port yazabilirsiniz; Compose ve yerel API başlatma betiği aynı değeri kullanır. Redis yine yalnız `127.0.0.1` üzerinde yayınlanır.

```powershell
docker compose up -d
dotnet restore Nexora.sln
./scripts/Start-LocalApi.ps1
```

Başlatma betiği `.env` değerlerini yalnız kendi process ortamına aktarır, DB connection stringini güvenli biçimde oluşturur ve API'yi Development olarak çalıştırır. Alternatif olarak `dotnet user-secrets` veya process ortamında `ConnectionStrings__DefaultConnection`, `ConnectionStrings__Redis`, `REDIS_PASSWORD`, `JWT_SECRET_KEY`, `EmailSettings__Host`, `EmailSettings__UserName` gibi gerçek seçenek adlarını tanımlayın. Betik connection string veya secret değerleri yazdırmaz.

Development'ta migration ve demo katalog seed'i çalışır. Production'da demo seed ve otomatik migration varsayılan olarak kapalıdır; `DemoSeedEnabled` ve `Database__AutoMigrate` yalnız açık tercihle kullanılır. Admin seed Development'ta veya `ADMIN_SEED_ENABLED=true` ile çalışır; parolayı ortamdan belirleyin. Development container alternatifi:

```powershell
docker compose --profile app up --build -d
```

API: `http://localhost:5285`; Swagger: `/swagger`; canlılık: `/health/live`; hazır olma: `/health/ready`. PostgreSQL `127.0.0.1:5432`, Redis `127.0.0.1:6379`, pgAdmin `127.0.0.1:5050`. Compose uygulama profili uploads, log ve DataProtection key volume'larını korur. Bu Compose örneği Development içindir.

Müşteri vitrinini ve yönetim panelini ayrı terminallerde başlatıyorum:

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

Vitrin portu 5173, admin portu 5174'tür. API varsayılan portu 5285'tir. Adresleri değiştirmek için ilgili frontend'in `.env.local` dosyasına `VITE_API_URL=http://localhost:5285/api/v1` ve `VITE_BACKEND_URL=http://localhost:5285` yazın. Vite secret saklama yeri değildir; `VITE_` değerleri tarayıcıya gider.

SMTP host/user boşken Development'ta gönderim simüle edilir; kod/token/body loglanmaz. Gerçek gönderim için `.env` içindeki `EmailSettings__...` alanları kullanılır. `Frontend__BaseUrl` e-posta bağlantıları ve iyzico dönüş sayfasının adresini belirler.

## Ödeme akışı

- Kullanıcı `/api/v1/payments/initialize` üzerinden ödeme oturumu başlatır. Tutar sunucuda hesaplanır; stok ve kupon hakkı işlem içinde ayrılır.
- Kart bilgileri iyzico'nun barındırdığı HTTPS sayfasında girilir. Nexora'nın eski doğrudan kart formu ve `POST /orders` endpoint'i yoktur.
- iyzico form POST isteğini `/api/v1/payments/callback` adresine gönderir. API sonucu sağlayıcıdan sorgular; sipariş eşleşmesi, tutar, para birimi ve fraud onayı kontrol edilir.
- Callback, vitrindeki `/payment-result` sayfasına 303 ile yönlendirir. Ekran yalnız giriş yapmış kullanıcıya ait ödeme durumunu API'den okur; URL parametresi ödeme kanıtı değildir.
- Tekrarlanan callback stok veya kuponu ikinci kez tüketmez. Hangfire işi sonuçlanmamış ödemeleri yeniden sorgular; belirsiz işlemlerin rezervasyonu korunur.

Sandbox ve canlı API adresleri backend yapılandırmasıyla seçilir. Development dışında eksik anahtarlar ve geçersiz callback ayarı başlangıç doğrulamasında reddedilir. Otomatik iade API'si mevcut değildir. Gerçek iyzico sandbox tahsilatı mevcut doğrulama kapsamında çalıştırılmamıştır. Yapılandırma ve durumların açıklaması [ödeme belgesinde](docs/iyzico-payments.md) bulunur.

## Doğrulama

```powershell
dotnet test Nexora.sln -c Release --collect:"XPlat Code Coverage"
```

Frontend başına `npm test`, `npm run lint`, `npm run build` ve `npm audit --audit-level=high` komutları bulunur. CI bunları, backend testlerini, PostgreSQL/Redis entegrasyon kontrollerini, container HTTP smoke kontrollerini, NuGet audit, Gitleaks, dependency review ve CodeQL'i çalıştırır. Güncel sonuçlar GitHub Actions koşusunda ve test artifact'lerinde görülebilir.

Test sayısı ve coverage oranı için güncel TRX/coverage çıktılarını esas alıyorum. InMemory testleri PostgreSQL constraint, SQL ve transaction davranışını doğrulamadığı için ayrı altyapı testleri de kullanıyorum. Bu testleri yerelde `NEXORA_TEST_POSTGRES` / `NEXORA_TEST_REDIS` ayarlarıyla, geliştirme verilerinden ayrı bir test veritabanında çalıştırabilirsin.

## Güvenlik ve lisans

Gerçek anahtarları ve parolaları yerel `.env`, .NET User Secrets veya sunucunun ortam değişkenlerinde tutuyorum; depoda paylaşmıyorum. Güvenlik bildirimleri için [SECURITY.md](SECURITY.md) dosyasına bakabilirsin. Projeyi [MIT lisansıyla](LICENSE) paylaşıyorum.
