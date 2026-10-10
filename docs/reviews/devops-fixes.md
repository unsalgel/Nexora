# DevOps, medya ve yan etki düzeltmeleri

2026-10-10 tarihli review sonrası bu modüllerde uygulanan değişikliklerdir. Ödeme mock kapsamı korundu; kullanıcının mevcut DB/Redis verileri ve kaynak secret dosyaları değiştirilmedi. Mimari katman bağımlılığı korundu; migration ana akışta birleştirildi.

| Bulgu | Uygulama | Kanıt / sınır |
|---|---|---|
| F04 | Alpine runtime'a tzdata/ICU eklendi; non-root yazılabilir uploads/logs/keys klasörleri hazırlandı. | SDK8 Release Docker publish ve Production başlangıcı geçti; Europe/Istanbul Hangfire jobs zamanlandı. Gerçek PNG upload musl native codec'i de çalıştırdı. |
| F17 kategori/marka | Duplicate isim kontrolü soft-deleted kayıtları da içerir; global unique index sözleşmesiyle uyumlu conflict döner. | Silinmiş category/brand isimlerinin tekrar kullanımını reddeden regresyonlar. Diğer entity parçaları ana akıştadır. |
| F18 | IEmailService scoped DB outbox'a ekler; çağıran final SaveChanges ile atomiktir. Hangfire dispatch backoff/azami ömür/deneme/retention uygular. API realtime adapter ve kategori/settings uygulama yardımcıları hatayı loglar ve committed sonucu korur. | Gerçek PostgreSQL rollback testi iş satırı+e-postanın birlikte geri alındığını doğruladı. OTP payload encrypted; SMTP simülasyon/success/failure/expiry regression. Gerçek SMTP teslimi ve exactly-once garantisi yoktur. |
| F33 | `.env.example` native API isimleri, Compose secret gereksinimleri ve localhost portları düzeltildi. Yerel `.env` okuma için PowerShell script eklendi; Compose app profile ile persistent upload/keys/log volume sağlandı. | Test Compose gerçek API'yi process env ile başlattı. Kullanıcının `.env` değerleri okunup rapora dökülmedi. |
| F34 | NuGet taraması pipeline exit-code'larını korur; locale metin eşleşmesi yerine JSON validation zafiyet/scan error'da fail eder. DB+Redis readiness eklendi. | JSON parser ve gerçek /health/ready smoke. Uzaktaki Actions koşusu/branch protection çalıştırılmış sayılmaz. |
| F35 | Production demo katalog/varyant seed varsayılan kapalıdır. `DemoSeedEnabled` opt-in; admin ve migration bayrakları ayrıdır. | Production smoke `DemoSeedEnabled=false` altında boş katalogdan yalnız test kayıtları oluşturdu. Development demo davranışı devam eder. |
| F36 kapsam katkısı | CI Release unit/arch coverage + gerçek PostgreSQL/Redis Integration services + gerçek Production Docker HTTP upload/commerce smoke eklenir. Frontend lint/test/build/full npm audit çalışır. | Yerel gerçek commerce HTTP scripti ve Integration turu geçti; son birleşik sonuç ana rapordadır. InMemory'nin SQL/constraint/isolation sınırları açık. |
| F37 | 30 günlük sepet temizliği son aktiviteyi kullanır; kullanıcı komutlarıyla aynı usercart transaction lock altında yeniden kontrol eder. Batch sınırlıdır. | Eski oluşturulmuş ama dün güncellenmiş item korunumu ve gerçekten stale item silme testleri. |
| F38 | Category update tüm ancestor zincirini kontrol eder; create/update/delete ortak category-tree lock alır. | Üç seviyeli cycle reddi; iki eşzamanlı PostgreSQL reparent isteğinden yalnız biri commit olur. |
| F43 | CI Node20 yerine desteklenen Node24 LTS kullanır. .NET8 hedefi korunur; 10 Kasım 2026'dan önce .NET10 geçiş planı runbook'tadır. | SDK8 Docker Release derlenir. Framework upgrade tamamlanmış değildir; yakın support-end maddesi operasyon planı olarak açık kalır. |
| S05 | Somut ihtiyaç için MIT SkiaSharp + Linux.NoDependencies 4.153.1 eklendi. Tam decode/format-dimension-frame kontrolü, metadata taşımadan reencode; 5MiB input/output, 4096 dimension,16M pixel sınırları. | PNG/JPEG/WebP roundtrip; header-only/truncated/mismatch/dimension/nonseek oversize testleri. Release lisans hesabı/anahtarı gerekmez; lisans ve native bildirimler imaja dahil edilir. |
| S06 | File delete yalnız managed GUID formatlı URL'leri kabul eder; traversal/encoded path/external URL ve reparse point reddedilir. | Altı boundary regresyonu; kullanıcıya ait arbitrary dosya temizlenmez. |
| S10 | Daily orphan cleanup 24h grace, ürün/marka GUID dosya adı referansları ve media-reference kilidiyle çalışır. Bağlı/soft-deleted/absolute/query URL/fresh upload korunur; 100'lük query batch'i taramayı ilk 100 referansta kilitlemez. | 110 bağlı dosya+absolute deleted brand logo+fresh file+sonraki orphan fixture; ayrıca gerçek PostgreSQL SQL translation/ref preservation regresyonu. Object storage/multi-instance ortak mount ayrıca gerekir. |
| S14 | README teknik kapsam/AI/upload/auth/outbox iddiaları doğrulanabilir ifadelerle yenilendi. Sahte/sabit test sayısı ve production-ready garantisi kaldırıldı. | Operational runbook; test komutları, migration/seed, SMTP/keys/restore/runtime sınırlamaları açık. |

## Gerçek doğrulama

- `dotnet build src/Nexora.Infrastructure/Nexora.Infrastructure.csproj --configuration Release --no-restore`: 0 hata, 0 uyarı.
- Docker SDK8 Release API publish başarılı; Production API PostgreSQL16/Redis7 üzerinde başladı, Hangfire Istanbul timezone başarılı.
- `node scripts/smoke-api.mjs`: health/ready200, unauthmedia401, invalidlogin400, admin JWT login200, bozukPNG400, geçerli PNG upload200 ve static GET200.
- `node scripts/smoke-commerce.mjs`: son kaynaklardan yeniden oluşturulan imajda parallel cart/quote satır fiyatları/stalequote409/checkout201/snapshot+clear/staleproduct409/status transition/invalidenum/missing review404/logout401 ve v1/v1.0 ortak auth429 doğrulandı.
- Son birleşik Release backend koşusu 183/183 geçti; bunun 16'sı gerçek altyapı Integration testidir (15 PostgreSQL, 1 Redis), skip/fail yok. Son toplam/TRX sonucu ana düzeltme raporuna kaydedilir.
- Kaynak testleri eklenmiştir: LocalFileStorageServiceTests, EmailOutboxTests, FileCleanupJobTests, InfrastructurePostgresTests, category/brand, cart activity ve settings side-effect testleri.
- Son NuGet vulnerable/transitive JSON taraması 6 projede bildirilen zafiyet bulmadı; CI parser gerçek çıktı ve zafiyet/warning/format değişikliği negatif fixtures'ıyla doğrulandı. Bu tarama bilinmeyen/native upstream açıkların yokluğunu garanti etmez.
- İki HTTP smoke kontrolü son imajda ardışık geçti. Ardından yalnız `nexora-review-tests` Compose projesinin geçici konteynerleri/ağı kaldırıldı; proje etiketiyle kalan konteyner bulunmadığı doğrulandı.

## Kalan operasyon sınırları

Gerçek SMTP provider'ına mail gönderilmedi. SMTP ack ile DB processed kaydı arası crash tekrar teslim yaratabilir; terminal outbox error ve backlog izlenmelidir. Linux DataProtection XML anahtarlarının at-rest korunması mount/secret management sorumluluğudur; persistent key ring olmadan protected pending işler kaybedilir. Test Compose ephemeral'dir; geliştirme Compose volume'ları ayrıdır.

Yük, restore süresi, log/retention kapasitesi, shared-storage ölçeği ve çok instance toplam IP rate limiting için kapasite ölçümü veya gateway kurulumu bu çalışma içinde yapılmadı. Bunlar kaynak bugfix sonuçlarının yanında production deployment gereksinimleridir. .NET10 upgrade yapılmadı; yakın runtime destek sonu sessizce kapatılmış bulgu sayılmamalıdır. [Operasyon runbook'u](../operations.md) takip adımlarını verir.
