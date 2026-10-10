# Nexora operasyon ve doğrulama runbook'u

Bu belge öğrenme projesinin gerçek çalışma sınırlarını açıklar. Ödeme adaptörü mock'tur. Aşağıdaki işlemler canlıya dağıtım yapılmış olduğunu veya kapasite/SLA garantisini göstermez.

## Yapılandırma ve başlangıç

Compose `.env` okur; .NET bunu kendiliğinden okumaz. Windows geliştirmede `scripts/Start-LocalApi.ps1` `.env` değerlerini process environment'a aktarır, yerel PostgreSQL/Redis bağlantısını kurar ve API'yi başlatır. API secrets'ı `JWT_SECRET_KEY`, `REDIS_PASSWORD` veya native `ConnectionStrings__...` / `EmailSettings__...` isimleriyle alır. Frontend `VITE_` değerleri public'tir.

Development'ta admin ve demo katalog/varyant seed aktiftir. Production'da `ADMIN_SEED_ENABLED`, `DemoSeedEnabled` ve `Database__AutoMigrate` varsayılan olarak kapalı tutulmalıdır; ayrı opt-in amaçları vardır. Admin seed yalnız olmayan hesabı oluşturur/role bağlar; var olan parolayı yenilemez veya yönetici olmayan hesabı sessizce terfi ettirmez. Böyle bir e-posta çakışmasında startup diagnostic ile durur; seed bayrağını kapatın veya ayrı yeni bootstrap adresi seçin. Development varsayılan admin parolası başka ortamlarda kullanılmamalıdır.

`Frontend__BaseUrl`, e-postaların yönlendirdiği vitrinin HTTP/HTTPS köküdür. SMTP Production'da eksikse e-posta başarılı sayılmaz; outbox yeniden dener. Development'ta SMTP boşken simülasyon yapılır ve kod/token/body yazılmaz.

Production CORS origin listesi ve `ReverseProxy__KnownProxies__0` gibi trusted proxy IP listesi altyapıya göre açıkça ayarlanmalıdır. TLS reverse proxy'de sonlanırsa forward edilen scheme/istemci IP yalnız güvenilen proxy'den kabul edilir. API portunu halka doğrudan açmak bu sınırı atlar. `/health/live` process kontrolü, `/health/ready` PostgreSQL ve Redis erişim kontrolüdür; Redis login hız/deneme sayacı için gereklidir.

## Migration ve ilk kurulum

Normal production API başlangıcında uygulama migration çalıştırmaz. Dağıtımda .NET 8 ile uyumlu `dotnet-ef` aracı kullanarak migration SQL'i üretin; bağlantı sırlarını process ortamından sağlayın:

```powershell
New-Item artifacts -ItemType Directory -Force | Out-Null
dotnet ef migrations script --idempotent --project src/Nexora.Persistence --startup-project src/Nexora.Api --output artifacts/migrations.sql
```

Çıktıyı ve mevcut migration geçmişini inceleyip önce ayrılmış restore ortamında uygulayın. DDL yetkili migration hesabı ile uyguladıktan sonra runtime hesabının yalnız gerekli tablo/sequence erişimlerini bırakın. Hangfire kendi `hangfire` şemasını ayrıca hazırlar; ayrı kurulum hesabıyla önceden hazırlanan ortamda `Hangfire__PrepareSchema=false` seçilerek runtime'da şema hazırlama kapatılabilir. Yeni Hangfire sürümünde şema değişiklikleri kurulum adımında tekrar değerlendirilmelidir.

Fresh PostgreSQL'de eski `20261009100936_AddCouponsAndLogs` migration'ının elle yazılmış `xmin` CREATE/ALTER/DROP DDL'i sistem kolonu ile çakışıyordu; geçmiş migration'ın yalnız bu hatalı DDL'i düzeltildi. PostgreSQL her satırda `xmin` sağlar; application `uint Version` eşlemesi bunu kullanır. Uygulanmış eski migration geçmişi yeniden çalıştırılmaz. Bu değişiklik için var olan kullanıcı veritabanı değiştirilmedi; fresh izole PostgreSQL ile migration akışı test edilir. Yeni hardening migration'ı auth/outbox alanlarını ve bütünlük sınırlarını ekler; şema önkontrolünde çakışan/eski geçersiz veriler raporlanırsa düzeltmeden dağıtmayın.

Test Compose'ta `Database__AutoMigrate=true` yalnız ayrılmış smoke DB için kullanılır. Çok instance çalışan gerçek dağıtımda migration'ı eşzamanlı API başlangıçlarına bırakmayın.

## İzole gerçek altyapı testleri

Repo kökünde:

```powershell
docker compose -p nexora-review-tests -f docker-compose.test.yml up -d --wait
$env:NEXORA_TEST_POSTGRES = 'Host=localhost;Port=17432;Database=nexora_tests;Username=nexora_test;Password=local-test-only'
$env:NEXORA_TEST_REDIS = 'localhost:16379'
dotnet test Nexora.sln -c Release --filter 'Category=Integration'
```

Credentials yalnız yerel test fixtures'ı içindir. PostgreSQL 17432, Redis 16379 portlarını kullanır; geliştirme 5432/6379 veya mevcut volume'ler paylaşılmaz. Her PostgreSQL fixture yeni `nexora_review_test_<guid>` DB'si oluşturur ve yalnız bunu siler. `NEXORA_TEST_POSTGRES` hesabı bu test sunucusunda DB oluşturabilmelidir; bu değişkeni canlı sunucuya yöneltmeyin. Redis testleri benzersiz test key'leri kullanır.

Gerçek Production Alpine/Kestrel, migration, JWT/HTTP, görsel native codec ve commerce akışlarını çalıştırmak için:

```powershell
docker compose -p nexora-review-tests -f docker-compose.test.yml --profile smoke up -d --build --wait --wait-timeout 120
node scripts/smoke-api.mjs
node scripts/smoke-commerce.mjs
docker compose -p nexora-review-tests -f docker-compose.test.yml --profile smoke down --remove-orphans
Remove-Item Env:NEXORA_TEST_POSTGRES, Env:NEXORA_TEST_REDIS -ErrorAction SilentlyContinue
```

Test DB/Redis tmpfs'tir; container kaldırılınca test verileri kaybolur. API 18085 portundadır. Smoke scriptlerini test ortamıyla sınırlayın. `docker compose down -v` geliştirme veri volume'leri üzerinde kullanılmaz. CI backend services'ta aynı Integration sınıfını çalıştırır; ayrı container job bu iki HTTP scriptini çalıştırır. Yerel sonuçlar uzaktaki GitHub Actions koşusunun veya branch protection'ın kanıtı değildir.

## E-posta outbox ve arka plan işleri

`IEmailService` metotları DB context'e şifrelenmiş outbox kaydı ekler; kendi `SaveChanges`/commit'ini yapmaz. Çağıran command aynı transaction'da iş verisini ve bu kaydı kaydeder. Hangfire dakikalık dispatch en fazla 50 mesajı alır, SMTP'ye gönderir; hatada 2–60 dakika backoff uygular. OTP mesajı 10 dakika içinde gönderilemezse sonlandırılır; gerçek OTP'nin 15 dakikalık ömründen kısa bu pencere gecikmiş kod gönderimini sınırlar. Diğer mesajlarda azami yaş 3 gün, azami başarısız deneme 10'dur. Terminal kayıtta payload silinir, `LastError=Expired/AttemptsExhausted` nedenini korur. Tamamlanan/sonlandırılan kayıtlar 30 günden sonra her dispatch'te en fazla 1000 satır temizlenir.

SMTP at-least-once'dır: SMTP kabul ettikten sonra DB processed işaretinden önce process ölürse aynı mesaj tekrar gönderilebilir. Kullanıcıya görünen kod/sipariş kimliği tekrarlı e-postayı ilişkilendirmeye yardımcı olur; harici provider idempotency desteği olmadan exactly-once iddiası yoktur. SignalR bildirimi geçici olarak gönderilemezse committed HTTP işlem başarılı kalır ve hata structured log'a yazılır; istemci HTTP verisini tekrar sorgulamalıdır.

Operatör `OutboxMessages` üzerinde payload'ı açmadan pending sayısı, en eski `CreatedAtUtc`, `Attempts`, `LastError` ve son `ProcessedAtUtc` değerlerini izlemelidir. Hangfire failed/retry backlog'unu, worker heartbeat'ini, SMTP hatalarını ve disk doluluğunu gözleyin. Uyarı eşiği ve provider SLA'sı bu projede kurulu değildir; bekleyen işlerin büyümesi manuel operasyon gerektirir.

Sepet cleanup, son değişiklik (`UpdatedAtUtc ?? CreatedAtUtc`) üzerinden 30 gün hareketsiz satırları kullanıcı komutlarıyla aynı kilit altında yeniden kontrol edip temizler; günlük en fazla 100 kullanıcı ve kullanıcı başına 1000 satır işlenir. Auth cleanup expired/used OTP'yi 24 saatten, expired/revoked refresh kaydını 30 günden sonra günlük sınırlı batch'lerle temizler. Yoğun kullanımlı ortamda günlük batch kapasitesi/backlog ölçülmelidir.

## Dosyalar, anahtarlar ve yedek

API runtime non-root kullanır. Alpine imajda `tzdata` ve ICU vardır; Hangfire `Europe/Istanbul` zone'u başlangıçta çözülür. SkiaSharp MIT codec ve Linux musl native asset'leri PNG/JPEG/WebP input'unu tam decode/reencode eder. Input/output 5 MiB, tek boyut 4096, toplam 16 milyon piksel sınırı uygulanır; animasyon reddedilir. Codec patch'lerini NuGet audit ve güncel advisories ile izleyin.

Yalnız `/uploads/products/<guidN>.(jpg|jpeg|png|webp)` dosyaları managed'dır. Orphan job 24 saatten eski, ürün/marka referansı bulunmayan managed dosyaları aynı `media-reference` transaction kilidi altında siler; yeni upload'a bağlama süresi bırakır. Soft-deleted, absolute URL ve cache query'si taşıyan referanslar GUID dosya adı üzerinden korunur. Başka host'ta aynı GUID dosya adı görülürse konservatif olarak local dosya da korunur; fazladan retention yanlış silmeden tercih edilir. Kalıcı local storage tek disk/mount varsayımıdır; birden fazla API instance için ortak storage gerekir. Shared-volume ve advisory lock bütün instance'larda aynı DB ile çalışmalıdır.

`/app/data/keys`, outbox payload ve token replay korunumu için DataProtection anahtar halkasıdır. Bütün instance'lar aynı anahtar halkasını ve application name'i kullanmalıdır. Bu anahtarlar kaybolursa bekleyen korumalı payload'lar okunamaz ve replay state açılmaz. OTP HMAC anahtarı ayrıca JWT signing secret'ten domain separation ile türetilir; signing secret değişince bekleyen OTP'ler geçersiz olur. Linux file provider anahtarları kendiliğinden at-rest şifrelemez; mount erişimini app UID ile sınırlandırın, encrypted disk/secret management ve şifrelenmiş yedek kullanın. Varsayılan Docker geliştirme profili uploads, logs ve keys için named volume'lar kullanır.

Yedek paketi PostgreSQL dump'ı, uploads ve keys'in aynı kurtarma noktasına ait kopyalarını içermelidir. Bağlantı parolalarını komut satırına koymayın; yönetim hesabı/PGPASSFILE gibi ortamınıza uygun secret yöntemi kullanın. Ayrı restore DB'si ve disk hedefiyle:

1. API/worker yazılarını durdurup tutarlı dump/storage/key snapshot alın; checksum ve yedek tarihini kaydedin.
2. Ayrılmış kurtarma DB/diskine geri yükleyin; kaynak kullanıcı DB'sini hedef seçmeyin.
3. Beklenen migration geçmişi, ürün/sipariş sayıları, resim erişimi, login/session ve pending outbox'ın açılmasını doğrulayın.
4. Restore süresini ve veri kaybı penceresini ölçün; hedeflenen RTO/RPO bu projede henüz tanımlı değildir.

Şema geri alma veri kaybı yaratabilir. Önceki API imajına dönüş yalnız o imaj yeni şema ile uyumluysa kullanılmalıdır; aksi halde incelemiş restore/forward-fix planı gerekir.

## Runtime ve dependency bakım planı

CI Node 24 LTS kullanır; Node 20 EOL olduğu için kaldırıldı. API/CI/Docker net8.0 hedefini korur. .NET 8 destek sonu Microsoft takviminde **10 Kasım 2026** olarak duyurulur; .NET 9'a geçmek aynı yakın destek sonunu uzatmaz. .NET 10 LTS geçişini bu tarihten önce tamamlamak gerekir: SDK/TFM, ASP.NET/EF/Npgsql/Hangfire uyumunu beraber değerlendirip migration SQL farkı, Release build, birim/mimari+gerçek PostgreSQL/Redis, native codec/HTTP smoke ve audit'i tekrar çalıştırın. İş mantığı düzeltmesi sırasında körlemesine major framework upgrade yapılmadı; bu plan tamamlanmış upgrade değildir.

Paket yükseltirken lock dosyalarını commit'e dahil edin. NuGet audit JSON parser beklenmeyen çıktı/tarama hatasını başarılı saymaz; npm audit build/dev bağımlılıkları dahil high/critical kontrolü yapar. Coverage artifact'ini ve değişen kritik senaryoları inceleyin; sabit bir coverage yüzdesi garanti edilmez.

Birincil kaynaklar: [Microsoft .NET 8/9 destek sonu duyurusu](https://devblogs.microsoft.com/dotnet/dotnet-8-9-end-of-support/), [Node release takvimi](https://nodejs.org/en/about/previous-releases), [SkiaSharp paketi ve MIT lisansı](https://www.nuget.org/packages/SkiaSharp/4.153.1).
