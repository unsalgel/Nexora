# Nexora

Nexora, canlı sistemlerdeki doğruluk ve güvenlik pratiklerini öğrenmek için geliştirilen MIT lisanslı bir e-ticaret hobi projesidir. API, müşteri vitrini ve yönetim paneli aynı depoda bulunur. Ödeme servisi mock'tur; gerçek tahsilat veya canlıya çıkış iddiası yoktur.

## Mimari ve kapsam

- `Nexora.Domain`: entity'ler ve iş kuralı tipleri.
- `Nexora.Application`: MediatR CQRS, FluentValidation, DTO ve altyapı portları.
- `Nexora.Persistence`: PostgreSQL/EF Core, migration, indeks ve transaction kilitleri.
- `Nexora.Infrastructure`: auth/cache, SMTP outbox, arka plan işleri ve dosya depolama adaptörleri.
- `Nexora.Api`: HTTP/SignalR, middleware ve DI composition root.
- `Nexora.Web` / `Nexora.Admin`: React, TypeScript, Vite ve TanStack Query.

Katalog/varyant, sepet, sipariş, kupon, review, adres, kullanıcı/rol ve site ayarı akışları bulunur. Domain/Application bağımlılık yönü NetArchTest ile korunur. Katmanların bulunması tek başına bütün iş kurallarının doğruluğunu kanıtlamaz; regresyon ve gerçek altyapı testleri de gereklidir.

JWT kimlik doğrulama, yetkilendirme, token sürümü, IP sınırları ve güvenlik başlıkları kullanılır. EF `xmin` ve kontrollü transaction kilitleri farklı yarış durumlarını ele alır. Realtime olaylar isteğe bağlı güncellemelerdir; kaynak veri HTTP sorgusudur. E-postalar iş verisiyle aynı commit'te outbox'a yazılır ve Hangfire worker tarafından gönderilir.

AI asistanı public katalog bağlamıyla çalışır. XML etiketleri ve prompt talimatları model davranışına yardımcı olur; prompt injection'ı güvenlik garantisi olarak engellemez. API mesaj/geçmiş boyutlarını sınırlar; özel veri veya yetkili tool yürütme bu asistanın kapsamı değildir.

Uploadlar 5 MiB input/output, 4096 piksel boyut ve 16 milyon piksel sınırıyla JPG/PNG/WebP olarak tam decode edilip yeniden encode edilir. Animasyon kabul edilmez. GUID dosya adları, dar delete-path sınırı ve referans kontrolüyle orphan cleanup uygulanır.

## Yerel kurulum

Gereksinimler: .NET 8 runtime/SDK veya net8.0 hedefini destekleyen .NET 9 SDK, desteklenen Node LTS (CI: Node 24), npm ve altyapı için Docker Desktop. Paketler NuGet/npm lock/config dosyalarına göre yüklenir. `.NET 8` desteği 10 Kasım 2026'da biteceğinden .NET 10 geçişi ayrıca planlanmıştır; bu düzeltmeler framework hedefini değiştirmez.

PowerShell ile depo kökünde:

```powershell
Copy-Item .env.example .env
```

`.env` dosyasındaki `CHANGE_ME` değerlerini yerel geliştirme için değiştirin. JWT için en az 32 rastgele byte'tan üretilmiş anahtar kullanın. Gerçek dosya Git'e gönderilmez. `docker compose` `.env` dosyasını otomatik okur; **`dotnet run` otomatik okumaz**.

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

İki frontend'i ayrı terminallerde başlatın:

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

Vitrin portu 5173, admin portu 5174'tür. API varsayılan portu 5285'tir. Override gerekiyorsa ilgili frontend'in `.env.local` dosyasına `VITE_API_URL=http://localhost:5285/api` ve `VITE_BACKEND_URL=http://localhost:5285` yazın. Vite secret saklama yeri değildir; `VITE_` değerleri tarayıcıya gider.

SMTP host/user boşken Development'ta gönderim simüle edilir; kod/token/body loglanmaz. Gerçek gönderim için `.env` içindeki `EmailSettings__...` alanlarını doldurun. Production'da SMTP gereksinimlerini operasyon notlarına göre doğrulayın. `Frontend__BaseUrl` e-posta takip bağlantılarında kullanılır.

## Doğrulama

```powershell
dotnet test Nexora.sln -c Release --collect:"XPlat Code Coverage"
```

Frontend başına `npm run lint`, `npm run build`, `npm audit --audit-level=high` çalıştırın. CI bunları, backend testlerini, PostgreSQL/Redis entegrasyon kontrollerini, container başlangıç smoke kontrolünü, NuGet audit, Gitleaks, dependency review ve CodeQL'i çalıştıracak şekilde tanımlıdır. Bir workflow tanımı branch protection'ın etkin olduğunu veya uzaktaki son koşunun geçtiğini kanıtlamaz.

Test sayısı ve coverage oranı sabit belgelenmez; güncel TRX/coverage artifact'ini esas alın. InMemory birim testleri gerçek PostgreSQL constraint, SQL ve transaction davranışını doğrulamaz. Gerçek altyapı testlerini yerel olarak çalıştırmak için `NEXORA_TEST_POSTGRES` / `NEXORA_TEST_REDIS` ayarlarını kullanın. Bu ayarlarda ayrılmış test DB'si kullanılır.

## Üretim hedefi

TLS/reverse proxy, doğru origin/proxy listesi, secret store, paylaşılan kalıcı key/storage, ayrı migration hesabı, restore/rollback ve yük ölçümleri ayrı doğrulama gerektirir. Bunlar bu hobi projesinin otomatik olarak production-ready olduğu anlamına gelmez. .NET 10 geçişinde build/test/audit ve container kontrolünün tekrar geçmesi gerekir. [Güvenlik politikası](SECURITY.md) bakım adımlarını içerir.
