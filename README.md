# Nexora — Kurumsal E-Ticaret ve Yönetim Platformu

Nexora; Clean Architecture, Domain-Driven Design (DDD) ve CQRS prensiplerine tam uyumlu olarak geliştirilmiş; yüksek performanslı, ölçeklenebilir, güvenli ve modern bir tam kapsamlı (full-stack) e-ticaret platformudur.

Proje, hem son kullanıcı alışveriş deneyimini sunan müşteri vitrinini (`Nexora.Web`) hem de detaylı analitik, sipariş, envanter ve kupon yönetimini sağlayan idari portalı (`Nexora.Admin`) merkezi bir REST API (`Nexora.Api`) üzerinden yönetir.

---

## Mimari Yapı ve Prensipler

Proje, katmanlar arası bağımlılıkların yalnızca içe doğru aktığı **Clean Architecture** prensiplerine göre yapılandırılmıştır:

```
Nexora/
├── src/
│   ├── Nexora.Domain/         # Çekirdek Domain Varlıkları, Enum'lar, Değer Nesneleri, Hata Tipleri
│   ├── Nexora.Application/    # CQRS (MediatR), DTO'lar, FluentValidation, Pipeline Behaviors
│   ├── Nexora.Infrastructure/ # Güvenlik (JWT, BCrypt), Dış Servisler (Sahte Ödeme Altyapısı)
│   ├── Nexora.Persistence/    # EF Core 8, PostgreSQL Varlık Konfigürasyonları, DbContext, Migration'lar
│   ├── Nexora.Api/            # ASP.NET Core Web API, Controller'lar, Middleware'ler, Serilog
│   ├── Nexora.Web/            # React 19 + TypeScript + Vite + Tailwind CSS Müşteri Mağazası (Port 5173)
│   └── Nexora.Admin/          # React 19 + TypeScript + Vite + Tailwind CSS Yönetim Portalı (Port 5174)
├── docker-compose.yml         # PostgreSQL, Redis ve pgAdmin konteyner tanımları
└── Nexora.sln
```

### Temel Tasarım İlkeleri

* **CQRS (Command Query Responsibility Segregation):** Veri yazma (Command) ve veri okuma (Query) operasyonları MediatR üzerinden net bir şekilde ayrılmıştır.
* **Result Pattern:** Katmanlar arası operasyonel geri dönüşlerde kontrolsüz exception fırlatmak yerine tahmin edilebilir ve tip güvenli `Result<T>` deseni kullanılır.
* **Zorunlu Performans Standardı:** 
  * Veritabanı sorgularında tüm tabloları gereksiz `Include` ilişkileriyle belleğe çekmek yasaktır.
  * Tüm okuma işlemlerinde `AsNoTracking()` kullanılır.
  * Agregasyonlar, sayımlar ve gruplamalar veritabanı seviyesinde (`CountAsync`, `SumAsync`, `GroupBy`) çalıştırılır.
  * 500 ms üzerinde süren istekler `LoggingBehavior` tarafından otomatik olarak performans uyarısı olarak kaydedilir.
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
| Önbellek | Redis 7 | Dağıtık önbellekleme desteği |
| Kimlik ve Güvenlik | JWT & BCrypt | 15 dk Access Token + 7 gün Refresh Token, rol tabanlı yetkilendirme |
| Doğrulama | FluentValidation | İstek seviyesinde güçlü ve kurallı veri doğrulaması |
| Loglama | Serilog | Yapısal loglama; PostgreSQL, Günlük Dönen Dosya ve Konsol hedefleri |
| API Dokümantasyonu | Swagger / OpenAPI | JWT Bearer entegrasyonlu interaktif API arayüzü |

### Frontend (Web & Admin)

| Bileşen | Teknoloji / Kütüphane | Açıklama |
|---|---|---|
| Çekirdek | React 19 + TypeScript | Tip güvenli bileşen mimarisi (Strict Mode) |
| Geliştirme Aracı | Vite | Anlık HMR ve optimize üretim paketi |
| Stil Altyapısı | Tailwind CSS v4 | Modern, esnek ve utility-first tasarım sistemi |
| Sunucu Durumu | TanStack React Query v5 | Akıllı veri önbellekleme, arka plan senkronizasyonu |
| HTTP İstemcisi | Axios | Merkezi interceptor'lar ile sessiz 401 token yenileme |
| İkon Seti | Lucide React | Tutarlı ve hafif SVG ikon kütüphanesi |

---

## Modül Kapsamı ve Özellikler

### 1. Kimlik Doğrulama ve Güvenlik (Auth & Authorization)
* Müşteri ve Yönetici rolleri (`Customer`, `Admin`).
* Kayıt olma, giriş yapma, Access Token ve Refresh Token mekanizması.
* Güvenli token iptali (`Revoke`) ve arka planda çalışan sessiz token yenileme (Silent Refresh).

### 2. İdari Satış ve Performans Analitiği (Dashboard)
* Optimize edilmiş SQL sorgularıyla platform genelinde ciro, toplam sipariş ve Ortalama Sepet Tutarı (AOV) hesaplaması.
* 7, 14 ve 30 günlük zaman aralıklarıyla incelenebilen günlük ciro ve sipariş trend grafiği.
* Kategori bazlı hasılat dağılımı ve yüzde oranları.
* Sipariş durum dağılımı (Beklemede, Hazırlanıyor, Kargoda, Teslim Edildi, İptal).
* Kritik stok eşiğine (<= 30 adet) düşen ürünler için anlık uyarı listesi.

### 3. Sipariş ve Ödeme Yönetimi (Orders & Checkout)
* Müşteri sepet onaylama, teslimat adresi tanımlama ve sahte ödeme (Fake Payment) entegrasyonu.
* Luhn algoritması denetimi, otomatik kart sağlayıcı tespiti (Visa, Mastercard, Troy, Amex) ve 3D kart görselleştirmesi.
* İdari sipariş takibi: Sipariş numarası, müşteri adı, e-posta ve adrese göre dinamik arama.
* Tek tıkla sipariş durumu güncelleme (Ödendi -> Hazırlanıyor -> Kargoda -> Teslim Edildi -> İptal).
* Son 24 saat içinde gelen siparişler için otomatik "YENİ" durum rozeti.

### 4. Katalog, Kategori ve Marka Yönetimi
* Çoklu kategori ve marka ağacı.
* Varyant yönetimi (SKU, stok ve fiyat bazlı kombinasyonlar).
* Ürün görselleri ve galeri desteği.
* Ürün, kategori veya markayı kalıcı silmeden satıştan çekebilen aktif/pasif durum anahtarları (Soft State).
* Güvenli silme işlemleri için platform içi teyit pencereleri (`ConfirmModal`).

### 5. Kupon ve Promosyon Motoru
* Yüzdelik (%) veya Sabit Tutar (TL) indirim tipleri.
* Kupon kullanım limiti, son kullanma tarihi ve minimum sepet tutarı kuralları.
* Checkout sırasında anlık kupon doğrulama ve sepet indirim hesaplaması.
* Kupon kullanım kotasını gösteren canlı ilerleme çubuğu ve siparişle entegre çalışan kullanım sayacı.

### 6. Müşteri Deneyimi ve Etkileşim
* Favori ürün listesi oluşturma ve profil sayfası entegrasyonu.
* Satın alınan veya incelenen ürünlere 1-5 yıldız değerlendirme ve yorum ekleme.
* Ekranı kilitlemeyen popover menüsü ile sipariş ve işlem bildirimleri (`NotificationDropdown`).
* Ürün, marka ve SKU bazında arama yapabilen küresel katalog arama motoru.

---

## Kurulum ve Çalıştırma

### 1. Ön Koşullar
* .NET 8 SDK
* Node.js 20+ ve npm
* Docker Desktop

### 2. Altyapı Servislerini Başlatma
Proje kök dizininde bulunan Docker Compose dosyası ile PostgreSQL ve Redis servislerini çalıştırın:

```bash
docker compose up -d
```

Servis Portları:
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
* Varsayılan Yönetici Bilgileri: `admin@nexora.com` / `Admin123!`

---

## Kod Standartları ve Kalite Güvencesi

Projeye katkı sağlanırken `.agent/RULES.md` ve `.agent/skills/nexora-development/SKILL.md` dosyalarında belirtilen kurallara tam uyum zorunludur:
* Her katman kendi sorumluluğunda kalmalı, Controller'larda iş mantığı yer almamalıdır.
* Gereksiz veya ağır paket bağımlılıklarından kaçınılmalıdır.
* TypeScript tarafında `any` tipi kullanılmaz; tüm veri transfer nesneleri kesin tiplendirilir.
* Derleme adımlarında sıfır uyarı ve sıfır hata prensibi esastır.
