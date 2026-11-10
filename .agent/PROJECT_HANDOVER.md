# Nexora — Proje Devir ve Durum Raporu

Son güncelleme: **10 Kasım 2026**.

Bu belge, mevcut kaynak kodun statik incelemesine dayanır. Kodda bir özelliğin bulunması, uçtan uca çalıştığının veya üretime hazır olduğunun doğrulandığı anlamına gelmez. Bu incelemede build, test, container smoke veya gerçek/sandbox ödeme işlemi çalıştırılmadı; güncel CI sonuçları doğrulanmadı. Güncel test başarısı, sıfır hata/uyarı veya canlıya hazır olma iddiası yoktur.

İnceleme sırasında yerel dal `master`, son commit `8c4d4e8` idi. Bu bilgi tarihli bir kaynak kod görüntüsünü tanımlar; uzak depo, deployment veya PR durumunun doğrulaması değildir.

## 1. Proje Kimliği ve Mevcut Mimari

Nexora, müşteri vitrini ve yönetim paneli aynı API üzerinden çalışan genel amaçlı bir e-ticaret projesidir. V1 kapsamındaki modüllerin kodu ve daha önce V2 yol haritasında bulunan bazı özellikler mevcuttur; tüm kapsam için tamamlanma yüzdesi verilmemektedir.

- **Backend:** .NET 8 / ASP.NET Core Web API; Domain, Application, Infrastructure, Persistence ve Api katmanları; CQRS/MediatR ve Result yapısı.
- **Veritabanı:** PostgreSQL 16, EF Core 8 Code First ve Fluent API. Domain projesinde harici paket referansı yoktur; Application, Domain proje referansının yanında EF Core paketini de kullanır.
- **Önbellek:** Redis 7; `ICacheService`, `RedisCacheService` ile uygulanır. `AddMemoryCache()` kaydı bulunmasına rağmen kaynakta L1 `IMemoryCache` tüketimi saptanmadı; genel bir L1/L2 hibrit önbellek uygulandığı söylenemez.
- **Kimlik:** JWT, BCrypt, refresh token rotasyonu, veritabanı üzerinden oturum doğrulama; FluentValidation ve rate limiting.
- **İletişim ve işler:** SignalR (`/hubs/app`), Hangfire/PostgreSQL, SMTP ve e-posta outbox altyapısı.
- **Ödeme:** `IPaymentGateway` → `IyzicoPaymentAdapter`; iyzico Checkout Form, callback ve ödeme durumu sorgulama akışı.
- **API sürümleme:** `ApiControllerBase` üzerinde `api/v{version:apiVersion}/[controller]`; mevcut sürüm 1.0.
- **Frontend:** Web ve Admin paket bildirimlerinde React `^19.2.8`, React Router 7, TypeScript, Vite, Tailwind CSS 4, TanStack Query, Axios ve Lucide React. Admin bağımlılıklarında Recharts bulunmuyor. Bunlar paket bildirimleridir; kurulu sürümlerin çalışma zamanı doğrulaması değildir.
- **Loglama ve denetim:** Serilog konsol/dosya çıkışları, `IDbLogger` üzerinden veritabanı logları, `AuditEntry` ve `AuditRecorder` altyapısı.
- **Dosya depolama:** `IFileStorageService` için `LocalFileStorageService` kayıtlıdır.
- **Kalite altyapısı:** xUnit, FluentAssertions, NetArchTest; PostgreSQL/Redis entegrasyon testleri, frontend Node regresyon testleri, GitHub Actions güvenlik ve kalite kontrolleri.

Temel kaynaklar: `src/Nexora.Infrastructure/DependencyInjection.cs`, `src/Nexora.Api/Program.cs`, `src/Nexora.Api/Controllers/ApiControllerBase.cs`, iki frontend projesinin `package.json` dosyaları.

---
## 2. 🚨 Geliştirme Kuralları ve Keskin Kırmızı Çizgiler (Anayasa)

Projeye dahil olan her asistan / geliştirici aşağıdaki kurallara **harfiyen** uymak zorundadır. Bu kurallar tartışmaya kapalı **keskin ve aşılamaz kırmızı çizgilerdir**:

### 🛑 KESKİN VE AŞILAMAZ TEMEL İLKELER
1. **Rol ve Kıdem Standardı (+30 Yıllık Dörtlü Şapka):**
   Asistan/Geliştirici; projede yapacağı her analizi, tasarlayacağı her mimariyi, yazacağı her kod satırını ve güvenlik değerlendirmesini;
   * **+30 yıllık deneyimli Senior Software Engineer,**
   * **+30 yıllık deneyimli Senior Software Architect,**
   * **+30 yıllık deneyimli Senior Security Engineer,**
   * **+30 yıllık deneyimli Senior DevOps Engineer**  
   rol ve vizyonuyla ele almak zorundadır. Baştan savma, geçici (hacky), over-engineered veya güvenlik zafiyeti barındıran hiçbir yaklaşım kabul edilemez.

2. **İstisnasız Her İşlemde Kullanıcı Onayı Şartı:**
   Yapılacak en ufak dosya düzenlemesinde, mimari tercihte, komut çalıştırmada veya adıma geçişte **kullanıcıdan açık onay alınmadan KESİNLİKLE KOD YAZILAMAZ, KOMUT KOŞULAMAZ VE SONRAKİ AŞAMAYA GEÇİLEMEZ.**  
   *Zorunlu Akış:* **Analiz Yap $\rightarrow$ Yapılacak İşlemi Detaylıca Açıkla $\rightarrow$ KULLANICI ONAYI BEKLE $\rightarrow$ Onay Gelince Kodla $\rightarrow$ Yapılanı Özetle $\rightarrow$ Yeniden Onay Bekle.**  
   Kullanıcıdan açık onay almadan kesinlikle `git commit` / `git push` yapılamaz; yeni NuGet veya npm paketi eklenemez.
3. **Modül Bazlı Dal (Branch) ve PR Zorunluluğu (İsimler Kesinlikle Türkçe):**
   Her yeni modül ve özellik için kesinlikle ayrı bir Git branch'i açılır. Dal (branch) isimleri ve Pull Request (PR) başlıkları **kesinlikle Türkçe** olacaktır (örn: `feat/api-surumleme`, `feat/arka-plan-isleri`, PR: `feat: API sürümleme altyapısı eklendi`). Ana dalda doğrudan çalışılamaz; her modül kendi dalında tamamlanır ve doğrulanır.

### 📋 TEKNİK KODLAMA VE MİMARİ STANDARTLARI
3. **Sıfır Boilerplate & Temiz Kod:**
   * Controller metotlarında ASP.NET Core'un zaten otomatik bağladığı gereksiz `[FromBody]`, `[FromQuery]` gibi öznitelikler **kesinlikle yazılmaz**.
   * Framework'ün varsayılan çözdüğü durumlar için yapay ara katmanlar veya sarmalayıcılar oluşturulmaz.
4. **Dil ve Yorum Standartları:**
   * Sınıf, metot, değişken, dosya ve interface isimleri: **İngilizce**.
   * Kod içi tüm yorum satırları, açıklamalar, kullanıcıya dönen hata mesajları ve toast bildirimleri: **İSTİSNASIZ TÜRKÇE**.
   * Kod tabanında `TODO`, `HACK`, `FIXME` gibi geçici notlar bırakılamaz.
5. **Tip Güvenliği (Frontend):**
   * TypeScript kodlarında kesinlikle `: any` veya `as any` kullanılamaz; tüm tipler eksiksiz modellenir (`unknown` veya strongly-typed arayüzler).
6. **Veritabanı & Performans:**
   * Okuma sorgularında `AsNoTracking()` zorunludur.
   * Filtreleme ve sayfalama asla C# tarafında (`ToList` sonrası) yapılmaz; `IQueryable` üzerinde DB seviyesinde bitirilir.
   * N+1 sorgular kesinlikle yasaktır (`Include` veya DTO `Select` projeksiyonu kullanılır).
7. **Loglama Kuralı:**
   * Serilog çağrılarında `$""` (string interpolation) yasaktır; yapısal şablonlar kullanılır (`{OrderId}`).
8. **Token Tasarrufu:**
   * Yanıtlarda gereksiz gevezelik ve laf kalabalığı yapılmaz; doğrudan sonuca, çalışan koda ve net teknik bilgilere odaklanılır.

---

## 3. Kodda Mevcut Modüller

Aşağıdaki liste, kaynak kodda bulunan uygulama kapsamını gösterir; başarılı kabul testi veya eksiksiz ürün teslimi listesi değildir.

| Alan | Kodda görülen kapsam / sınır |
|---|---|
| Kimlik ve kullanıcı | Kayıt, giriş, e-posta doğrulama, parola sıfırlama, refresh token rotasyonu, hesap durumu ve kullanıcı rol atama işlemleri. |
| Katalog | Ürün, kategori, marka, varyant, görsel ve özellik yönetimi; aktif/pasif durumlar. |
| Müşteri vitrini | Ürün listeleme/detay, arama/filtreleme, sepet, favoriler, adresler ve değerlendirmeler. |
| Sipariş ve ödeme | iyzico ödeme başlatma, stok/kupon rezervasyonu, callback doğrulaması, ödeme durumu ve sipariş yönetimi. Eski simüle ödeme akışı mevcut kaynakta bulunmuyor. |
| Kupon | Kupon yönetimi ve sepet fiyatlandırması; kullanım ve rezervasyon alanları. |
| Bildirimler | SignalR hub ve istemci bildirim altyapısı; hesap/oturum sonlandırma olayları. Tüm olay senaryoları bu incelemede çalıştırılmadı. |
| Yönetim paneli | Dashboard, ürün/kategori/marka/varyant, sipariş, kullanıcı/rol atama, kupon, yorum ve ayar ekranları. Canlı sistem loglarını görüntüleme ekranı doğrulanamadı. |
| Arka plan işleri | E-posta outbox gönderimi, ödeme mutabakatı, kupon/sipariş/sepet temizliği, dosya/oturum/log bakımı. |

## 4. Mevcut Akışlar ve Önceki Handover'dan Farklar

### 4.1. Ödeme ve stok

- `InitializePaymentCommandHandler`, kullanıcı sepeti transaction'ı, ürün/kupon kilitleri, idempotency anahtarı ve istek özeti ile çalışır. Ödeme oturumu başlatılırken stok ve kupon hakkı rezerve edilir.
- `ApplicationTransaction`, PostgreSQL üzerinde `pg_advisory_xact_lock` kullanır. Ürün ve varyant `xmin` concurrency token'ları korunmuştur; sipariş ve kupon için de concurrency yapılandırmaları vardır. Bu mekanizmaların varlığı tüm stok yarışı risklerinin sıfırlandığına dair kanıt değildir.
- `PaymentsController` ödeme başlatma, callback ve durum endpoint'lerini sağlar. `PaymentReconciliationJob` bekleyen sonuçları tekrar kontrol eder.
- `FakePaymentService`, `CreateOrderCommandHandler`, `cardValidation.ts` ve `KNOWN_TEST_CARDS` mevcut kaynak taramasında bulunmadı. Önceki Luhn/test kartı ve eski handler anlatımı güncel değildir.
- `docs/iyzico-payments.md`, ödeme durumlarını ve operasyonel sınırları açıklar. Panelden otomatik iyzico iadesi yapılmadığı belirtilmektedir; entegrasyonun bulunması tüm ödeme/iade kapsamının tamamlandığı anlamına gelmez.

Kaynaklar: `src/Nexora.Application/Features/Payments/`, `src/Nexora.Infrastructure/Payments/`, `src/Nexora.Persistence/Context/ApplicationTransaction.cs`, `src/Nexora.Persistence/Configurations/`.

### 4.2. Oturum güvenliği ve token yenileme

- Önceki JTI kara listesi açıklamasının yerine, `AuthenticationSessionValidator` kullanıcı durumu, e-posta doğrulaması, `SecurityStamp`, `SessionId` ve geçerli refresh token kaydını veritabanından kontrol eder.
- `RevokeTokenCommandHandler`, ilgili oturumun refresh token kayıtlarını iptal eder.
- `BrowserSession`, tarayıcı refresh token'ını HttpOnly cookie ile yönetir; tarayıcıya dönen yanıtın refresh token alanını boşaltır.
- Web ve Admin, `failedQueue` yerine `createRefreshCoordinator` ile ortak Promise kullanır; destekleyen tarayıcılarda `navigator.locks` ile koordinasyon yapar.

Kaynaklar: `src/Nexora.Api/Services/AuthenticationSessionValidator.cs`, `src/Nexora.Api/Services/BrowserSession.cs`, `src/Nexora.Application/Features/Auth/Commands/RevokeToken/RevokeTokenCommandHandler.cs`, Web/Admin `src/lib/apiClient.ts` ve `refreshCoordinator.ts` dosyaları.

### 4.3. Hata yönetimi ve arka plan işleri

- `GlobalExceptionHandlerMiddleware`, veritabanına hata kaydını ayrı `try/catch` içinde tutar ve concurrency hatalarını 409'a eşler. Yanıt başlamışsa bağlantıyı sonlandıran ayrı yol da vardır; her durumda JSON yanıt garantisi verilmez.
- Hangfire ve API sürümleme kurulacak yeni modüller değil, mevcut kodun parçalarıdır.
- Sepet işi hatırlatma e-postası göndermek yerine 30 günden eski sepet satırlarını temizler.
- `OrderCleanupJob`, 24 saatten eski ve `PaymentToken == null` olan bekleyen siparişleri ele alır. Token'lı iyzico ödemelerinin sonucu ayrı mutabakat akışıyla yönetilir; tüm bekleyen ödemeler için koşulsuz 24 saatlik iptal varsayılmamalıdır.

Kaynaklar: `src/Nexora.Api/Middlewares/GlobalExceptionHandlerMiddleware.cs`, `src/Nexora.Api/Program.cs`, `src/Nexora.Infrastructure/BackgroundJobs/`.

## 5. Açık Eksikler ve Doğrulanmamış Noktalar

1. **Ödeme alıcı/adres verileri:** `InitializePaymentCommandHandler`, telefon (`+905555555555`), kimlik numarası (`11111111111`), şehir (`Istanbul`) ve posta kodunu (`34000`) sabit örnek değerlerle dolduruyor. Bu davranış sandbox ile sınırlandırılmış değil. Gerçek müşteri/adres verilerinin doğru aktarımı çözülmeden canlı kullanım için uygunluk varsayılamaz.
2. **Yönetim panelinde log görüntüleme:** Log saklama altyapısı mevcut; ancak Admin rota/sayfalarında ve API controller'larında log listeleme özelliği bulunamadı. Önceki tamamlanmış özellik iddiası kaldırılmıştır.
3. **Yorum dili:** `PaymentsController` ve `InitializePaymentCommandHandler` içinde Türkçe yorum kuralına aykırı İngilizce yorumlar bulunuyor. Bu incelemede düzeltilmedi.
4. **Doğrulama eksikliği:** Güncel derleme, test, CI, container ve uçtan uca ödeme sonuçları bu incelemede doğrulanmadı. Üretim ortamı ayarları ve deployment durumu değerlendirilmedi.
5. **Belge tutarlılığı:** Bu güncelleme yalnızca handover kapsamındadır. `RULES.md` ve geliştirme skill'inde eski teknoloji/akış ifadeleri bulunabilir; bu dosyalar değiştirilmedi. Çelişkiler ilgili görev kapsamında mevcut kod ve kullanıcı talimatlarıyla birlikte değerlendirilmelidir.

Bu liste statik karşılaştırmada saptanan bulgulardır; tam güvenlik denetimi veya tüm kod kusurlarının envanteri değildir.

## 6. Test ve CI Durumu

- Kaynak taramasında backend için 219 adet `[Fact]`, `[Theory]`, `[PostgresFact]` veya `[RedisFact]` işaretlemesi sayıldı. Bu, çalıştırılan test sayısı değildir; teori veri satırları ve koşullu testler sonucu değiştirir.
- Birim/mimari testlerin yanında gerçek PostgreSQL ve Redis entegrasyon testleri bulunuyor.
- Web ve Admin'de Node tabanlı regresyon testleri mevcut.
- `.github/workflows/security-scan.yml`, backend testleri, entegrasyon testleri, frontend lint/test/build, NuGet/npm denetimi, container smoke, dependency review, Gitleaks ve CodeQL işleri tanımlıyor. Workflow tanımları, bu işlerin son koşuda geçtiğinin kanıtı değildir.
- Önceki test başarı sayısı ve sıfır hata/uyarı ifadeleri güncel sonuç olarak kullanılmamalıdır. Yeni doğrulama yapıldığında tarih, commit, komut, ortam, geçen/kalan/atlanan testler ve sınırlamalar ayrıca kaydedilmelidir.

## 7. Sonraki Çalışmalar İçin Durum

Yeni çalışma kullanıcı tarafından seçilir ve geliştirme kurallarındaki süreç izlenir. Aşağıdakiler otomatik başlatılacak görevler değildir:

| Başlık | Mevcut durum / sonraki ihtiyaç |
|---|---|
| Ödeme | iyzico altyapısı var; sabit alıcı/adres verileri ve ödeme/iade kapsamının sınırları ele alınmalı, uçtan uca doğrulama yapılmalı. |
| Hangfire | Kayıtlar ve işler var; çalışma davranışı doğrulanmalı. Terk edilmiş sepet hatırlatması mevcut temizleme işiyle karıştırılmamalı. |
| API sürümleme | v1 rota altyapısı var; sıfırdan kurulacak özellik olarak listelenmemeli. |
| Yönetim log ekranı | Mevcut kaynakta bulunamadı; ihtiyacı ve kapsamı kullanıcıyla kararlaştırılmalı. |
| Kalite doğrulaması | Güncel build/test/CI sonuçları toplanmalı; kaynakta test bulunması başarı olarak raporlanmamalı. |
| MinIO / AWS S3 | Mevcut DI yerel dosya depolamayı kullanıyor; nesne depolama gelecekte değerlendirilecek bir seçenek. |
| Gelişmiş kampanya motoru ve Elasticsearch / OpenSearch | Önceki yol haritası önerileri; bu inceleme tamamlandıklarını doğrulamadı ve uygulama kararı vermedi. |

## 8. Yeni Sohbete Başlangıç

> Nexora projesinde devam etmeden önce `.agent/skills/nexora-development/SKILL.md`, `.agent/RULES.md`, `.agent/CODE_REVIEW_RULES.md` ve `.agent/PROJECT_HANDOVER.md` dosyalarını oku. Handover 10 Kasım 2026 tarihli statik kod incelemesine dayanıyor; güncel çalışma ağacını ayrıca kontrol et. iyzico, Hangfire ve API sürümleme kodda mevcut. Açık eksikleri ve doğrulama sınırlarını koru; testlerin geçtiğini veya projenin canlıya hazır olduğunu varsayma. Kullanıcının seçtiği görev ve onaylı kapsam dışında geliştirme başlatma.
