# Nexora — Kurumsal E-Ticaret ve Yönetim Platformu

Nexora; Clean Architecture, Domain-Driven Design (DDD) ve CQRS prensiplerine tam uyumlu olarak geliştirilmiş; yüksek performanslı, ölçeklenebilir, kurumsal güvenlik standartlarına sahip tam kapsamlı (full-stack) bir e-ticaret platformudur.

Proje, hem son kullanıcı alışveriş deneyimini sunan müşteri vitrinini (`Nexora.Web`) hem de detaylı analitik, sipariş, envanter ve kupon yönetimini sağlayan idari portalı (`Nexora.Admin`) merkezi bir REST API (`Nexora.Api`) üzerinden yönetir.

---

## Mimari Yapı ve Prensipler

Proje, katmanlar arası bağımlılıkların yalnızca içe doğru aktığı **Clean Architecture** prensiplerine göre yapılandırılmıştır:

```
Nexora/
├── src/
│   ├── Nexora.Domain/         # Çekirdek Domain Varlıkları, Enum'lar, Değer Nesneleri, Hata Tipleri
│   ├── Nexora.Application/    # CQRS (MediatR), DTO'lar, FluentValidation, Pipeline Behaviors
│   ├── Nexora.Infrastructure/ # Güvenlik (JWT, BCrypt, Token Blacklist), Dış Servisler (Ödeme, Dosya Depolama)
│   ├── Nexora.Persistence/    # EF Core 8, PostgreSQL Varlık Konfigürasyonları, DbContext, Migration'lar
│   ├── Nexora.Api/            # ASP.NET Core Web API, Controller'lar, Middleware'ler, Serilog, Rate Limiter
│   ├── Nexora.Web/            # React + TypeScript + Vite + Tailwind CSS Müşteri Mağazası (Port 5173)
│   └── Nexora.Admin/          # React + TypeScript + Vite + Tailwind CSS Yönetim Portalı (Port 5174)
├── docker-compose.yml         # PostgreSQL, Redis ve pgAdmin konteyner tanımları
└── Nexora.sln
```

### Temel Tasarım İlkeleri

* **CQRS (Command Query Responsibility Segregation):** Veri yazma (Command) ve veri okuma (Query) operasyonları MediatR üzerinden birbirinden bağımsız şekilde yönetilir.
* **Result Pattern:** Katmanlar arası operasyonel geri dönüşlerde kontrolsüz exception fırlatmak yerine öngörülebilir ve tip güvenli `Result<T>` deseni kullanılır.
* **Zorunlu Performans ve Sorgu Optimizasyonu:** 
  * Veritabanı sorgularında tüm tabloları gereksiz `Include` ilişkileriyle belleğe çekmek yasaktır.
  * Tüm okuma işlemlerinde `AsNoTracking()` ve `.Select()` projeksiyonları kullanılır.
  * Agregasyonlar, sayımlar ve gruplamalar veritabanı seviyesinde (`CountAsync`, `SumAsync`, `GroupBy`) çalıştırılır.
  * Çoklu ilişkisel sorgularda Cartesian Product (kartezyen çarpım) patlamasını engellemek için küresel EF Core `AsSplitQuery()` davranışı aktiftir.
* **Doğrulama Hattı:** İstek modelleri MediatR `ValidationBehavior` üzerinden FluentValidation kurallarından geçer; geçersiz istekler handler'a ulaşmadan engellenir.

---

## Teknoloji Yığını

### Backend

| Bileşen | Teknoloji / Kütüphane | Açıklama |
|---|---|---|
| Çalışma Zamanı | .NET 8 (LTS) | Modern, yüksek performanslı ASP.NET Core Web API |
| Mimari Desenler | Clean Architecture, CQRS | MediatR 12 entegrasyonu ile gevşek bağlı modüler yapı |
| Veritabanı | PostgreSQL 16 | İlişkisel veri modeli ve ACID uyumluluğu |
| ORM | Entity Framework Core 8 | Code-First yaklaşımı, Fluent API ve optimize SQL projeksiyonları |
| Dağıtık Önbellek | Redis 7 & InMemory | İki seviyeli (L1/L2) önbellekleme ve anlık kara liste kontrolü |
| Kimlik ve Güvenlik | JWT (JWS + JTI) & BCrypt | 15 dk Access Token + 7 gün Refresh Token, saat toleransı sıfırlama, anlık token iptali |
| Rate Limiting | ASP.NET Core RateLimiter | Auth endpoint'lerinde IP bazlı brute-force koruma mekanizması |
| Doğrulama | FluentValidation | İstek seviyesinde güçlü ve kurallı veri doğrulaması |
| Loglama | Serilog | Yapısal loglama; PostgreSQL, Günlük Dönen Dosya ve Konsol hedefleri |
| API Dokümantasyonu | Swagger / OpenAPI | JWT Bearer entegrasyonlu interaktif API arayüzü |

### Frontend (Web & Admin)

| Bileşen | Teknoloji / Kütüphane | Açıklama |
|---|---|---|
| Çekirdek | React + TypeScript | Tip güvenli bileşen mimarisi (Strict Mode, `any` yasak) |
| Geliştirme Aracı | Vite | Anlık HMR ve optimize üretim paketi |
| Stil Altyapısı | Tailwind CSS v4 | Modern, esnek ve utility-first kurumsal tasarım sistemi |
| Sunucu Durumu | TanStack React Query v5 | Akıllı veri önbellekleme, arka plan senkronizasyonu |
| HTTP İstemcisi | Axios | Merkezi interceptor'lar ile sessiz 401 token yenileme |
| İkon Seti | Lucide React | Tutarlı ve hafif SVG ikon kütüphanesi |

---

## Modül Kapsamı ve Kurumsal Özellikler

### 1. İleri Düzey Kimlik Doğrulama ve Güvenlik (Auth & Security)
* **Rol Tabanlı Yetkilendirme:** Müşteri (`Customer`) ve Yönetici (`Admin`) rolleri.
* **Kademeli Hesap Kilitleme & Brute-Force Koruması:** 
  - Hatalı girişlerde artan bekleme süreleri, 10 ve üzeri başarısız denemede hesabı 24 saat otomatik kilitleme.
  - Global IP bazlı ASP.NET Core Rate Limiter koruması.
* **Anlık Güvenlik Uyarısı:** Giriş sonrası önceki başarısız denemeleri tarih, saat ve IP bazında gösteren güvenlik bilgilendirme penceresi.
* **Anlık Token İptali (Instant Token Revocation):**
  - Üretilen her Access Token'a benzersiz `jti` (JWT ID) atanır.
  - Kullanıcı çıkış yaptığında token'lar `ITokenBlacklistService` üzerinden hem MemoryCache hem Redis'e işlenir.
  - `JwtBearerEvents.OnTokenValidated` kancası ile iptal edilen token'lar anında reddedilir.
  - `ClockSkew = TimeSpan.Zero` ayarı ile gizli 5 dakikalık tolerans sıfırlanmış, kesin süre kuralı getirilmiştir.

### 2. İdari Satış ve Performans Analitiği (Dashboard)
* Optimize SQL sorgularıyla platform genelinde ciro, toplam sipariş ve Ortalama Sepet Tutarı (AOV) hesaplaması.
* 7, 14 ve 30 günlük filtrelerle günlük ciro ve sipariş trend grafiği.
* Kategori bazlı hasılat dağılımı ve yüzde oranları.
* Sipariş durum dağılımı (Beklemede, Hazırlanıyor, Kargoda, Teslim Edildi, İptal).
* Kritik stok eşiğine (30 adet ve altı) düşen ürünler için anlık uyarı listesi.

### 3. Sipariş, Adres ve Ödeme Yönetimi (Orders & Checkout)
* **Adres Yönetimi:** İl ve ilçe seçicili, varsayılan adres belirleme destekli dinamik teslimat adresi tanımlama.
* **Ödeme Altyapısı:** Luhn algoritması denetimi, otomatik kart sağlayıcı tespiti (Visa, Mastercard, Troy, Amex) ve 3D etkileşimli kart görselleştirmesi.
* **İdari Sipariş Takibi:** Sipariş numarası, müşteri adı, e-posta ve teslimat adresine göre filtreleme ve sayfalama.
* **Durum Güncelleme:** Tek tıkla sipariş durumu akışı (Ödendi -> Hazırlanıyor -> Kargoda -> Teslim Edildi -> İptal).
* **Yeni Sipariş Göstergesi:** Son 24 saat içinde gelen siparişlerde otomatik parıldayan "YENİ" rozeti.

### 4. Katalog, Görsel ve Envanter Yönetimi
* **Gerçek Görsel Yükleme Pipeline'ı:** 
  - `IFileStorageService` ve `LocalFileStorageService` ile 5MB boyut ve MIME/dosya format doğrulaması.
  - Sürükle-bırak destekli görsel yükleme alanı, önizleme ve harici URL desteği.
* **Varyant Yönetimi:** Beden, renk ve numara kombinasyonları; SKU, stok ve fiyat takibi.
* **Gelişmiş Vitrin:** Silinen veya pasife alınan ürünlerin ana sayfa "Son Gezilenler" listesinden otomatik ayıklanması.
* **Yumuşak Durum (Soft State):** Ürün, kategori veya markayı kalıcı silmeden satıştan çekebilen aktif/pasif anahtarları.

### 5. Kupon ve Promosyon Motoru
* Yüzdelik (%) veya Sabit Tutar (TL) indirim tipleri.
* Kupon kullanım kotası, son kullanma tarihi ve minimum sepet tutarı kuralları.
* Checkout sırasında anlık kupon doğrulama ve sepet indirim hesaplaması.
* Kupon kullanım limitini gösteren canlı doluluk çubuğu.

### 6. Müşteri Deneyimi ve Etkileşim
* Favori ürün listesi oluşturma ve profil sayfası entegrasyonu.
* Satın alınan ürünlere 1-5 yıldız değerlendirme ve yorum ekleme.
* Ekranı kilitlemeyen popover menüsü ile sipariş ve işlem bildirimleri (`NotificationDropdown`).
* Ürün, marka ve SKU bazında arama yapabilen küresel katalog arama motoru.

---

## Kurulum ve Çalıştırma

### 1. Ön Koşullar
* .NET 8 SDK
* Node.js 20+ ve npm
* Docker Desktop

### 2. Altyapı Servislerini Başlatma
Proje kök dizinindeki Docker Compose dosyası ile PostgreSQL ve Redis servislerini başlatın:

```bash
docker compose up -d
```

Servis Bağlantı Noktaları:
* PostgreSQL: `localhost:5432`
* Redis: `localhost:6379`
* pgAdmin: `localhost:5050`

### 3. Backend API'yi Çalıştırma
```bash
dotnet restore
dotnet run --project src/Nexora.Api
```

* API Adresi: `http://localhost:5285`
* Swagger Dokümantasyonu: `http://localhost:5285/swagger`

### 4. Müşteri Web Uygulamasını Çalıştırma (Nexora.Web)
```bash
cd src/Nexora.Web
npm install
npm run dev
```

* Web Mağazası: `http://localhost:5173`

### 5. Yönetim Portalını Çalıştırma (Nexora.Admin)
```bash
cd src/Nexora.Admin
npm install
npm run dev
```

* Yönetim Paneli: `http://localhost:5174`
* Varsayılan Yönetici Bilgileri: `admin@nexora.com` / `Admin123*`

---

## Kod Standartları ve Kalite Güvencesi

Projeye katkı sağlanırken `.agent/RULES.md` ve `.agent/skills/nexora-development/SKILL.md` kurallarına tam uyum zorunludur:
* Katman sorumlulukları kesinlikle korunmalı, Controller'larda iş mantığı yer almamalıdır.
* Gereksiz veya ağır paket bağımlılıkları eklenmemelidir.
* `[ApiController]` altında `[FromQuery]` gibi gereksiz attribute'lar kullanılmamalıdır.
* TypeScript tarafında `any` tipi kesinlikle yasaktır; tüm veri transfer nesneleri kesin tiplendirilmelidir.
* Derleme ve üretim paketleme adımlarında sıfır uyarı ve sıfır hata prensibi esastır.
