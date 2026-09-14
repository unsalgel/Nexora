# Nexora Kurumsal E-Ticaret ve Yönetim Platformu

Nexora; Clean Architecture, Domain-Driven Design (DDD) ve CQRS prensipleri doğrultusunda geliştirilmiş, yüksek performans ve kurumsal güvenlik standartlarına sahip tam kapsamlı bir e-ticaret platformudur.

Platform; müşteri vitrini (`Nexora.Web`), yönetim portalı (`Nexora.Admin`) ve merkezi REST API servisinden (`Nexora.Api`) meydana gelmektedir.

---

## Mimari Tasarım ve Prensipler

Proje, iş kurallarının ve çekirdek varlıkların dış bağımlılıklardan tamamen izole edildiği Clean Architecture prensipleriyle yapılandırılmıştır.

```
Nexora/
├── src/
│   ├── Nexora.Domain/         # Çekirdek varlıklar, değer nesneleri, domain eventleri, hata tipleri
│   ├── Nexora.Application/    # CQRS komut ve sorguları (MediatR), DTO'lar, FluentValidation kuralları
│   ├── Nexora.Infrastructure/ # Güvenlik (JWT, BCrypt, Token Blacklist), Harici Entegrasyonlar (Yapay Zeka Asistanı, Ödeme, Depolama)
│   ├── Nexora.Persistence/    # EF Core 8, PostgreSQL konfigürasyonları, DbContext, Migration ve Seeder yapıları
│   ├── Nexora.Api/            # ASP.NET Core Web API, Controller'lar, Middleware'ler, Serilog, Rate Limiter
│   ├── Nexora.Web/            # React, TypeScript, Vite, Tailwind CSS Müşteri Vitrini (Port 5173)
│   └── Nexora.Admin/          # React, TypeScript, Vite, Tailwind CSS İdari Yönetim Portalı (Port 5174)
├── docker-compose.yml         # PostgreSQL, Redis ve pgAdmin konteyner tanımları
└── Nexora.sln
```

### Çekirdek İlkeler

* **CQRS (Command Query Responsibility Segregation):** Veri yazma ve okuma operasyonları MediatR hattı üzerinden ayrıştırılmıştır.
* **Result Deseni:** Katmanlar arası operasyonel geri dönüşlerde kontrolsüz istisna fırlatılması engellenmiş; tip güvenli `Result<T>` yapısı benimsenmiştir.
* **Sorgu ve Veritabanı Optimizasyonu:**
  * Okuma işlemlerinde `AsNoTracking()` ve doğrudan DTO seviyesinde `Select` projeksiyonu kullanılır.
  * İlişkisel sorgularda kartezyen patlamaları önlemek amacıyla global düzeyde `AsSplitQuery()` davranışı yapılandırılmıştır.
  * Toplam, ortalama ve adet hesaplamaları veritabanı motoru üzerinde çalıştırılır.
* **Merkezi Doğrulama Hattı:** İstek modelleri MediatR `ValidationBehavior` üzerinden otomatik FluentValidation süzgecinden geçer; geçersiz parametreler handler katmanına ulaşmadan engellenir.

---

## Teknoloji Altyapısı

### Backend

| Bileşen | Teknoloji / Kütüphane | Açıklama |
|---|---|---|
| Çalışma Zamanı | .NET 8 (LTS) | Yüksek başarımlı ASP.NET Core Web API |
| Mimari Yapı | Clean Architecture, CQRS | MediatR 12 tabanlı gevşek bağlı modüler tasarım |
| Veritabanı | PostgreSQL 16 | ACID uyumlu ilişkisel veri tabanı |
| ORM | Entity Framework Core 8 | Code-First yaklaşımı, Fluent API modellemeleri |
| Önbellek | Redis 7 & InMemory | İki seviyeli (L1/L2) dağıtık ve yerel önbellekleme mimarisi |
| Kimlik Doğrulama | JWT (JWS + JTI) & BCrypt | 15 dk Access Token, 7 gün Refresh Token, anlık iptal ve saat toleransı sıfırlama |
| Yapay Zeka Desteği | Google Gemini API (REST) | RAG mimarisiyle zenginleştirilmiş akıllı müşteri asistanı servisi |
| Hız Sınırlama | ASP.NET Core RateLimiter | Uç noktalarda IP tabanlı istek sınırlama ve kaba kuvvet koruması |
| Doğrulama | FluentValidation | İstek gövdeleri için kural tabanlı doğrulama altyapısı |
| Loglama | Serilog | Yapılandırılmış loglama; PostgreSQL, günlük dosya ve konsol çıktıları |
| API Arayüzü | Swagger / OpenAPI | JWT Bearer entegrasyonuna sahip interaktif test dokümantasyonu |

### Frontend (Web & Admin)

| Bileşen | Teknoloji / Kütüphane | Açıklama |
|---|---|---|
| Çekirdek | React + TypeScript | Tip güvenli bileşen mimarisi (Strict Mode standardı) |
| Geliştirme Aracı | Vite | Hızlı HMR döngüsü ve optimize üretim paketlemesi |
| Tasarım Altyapısı | Tailwind CSS v4 | Kurumsal ve tutarlı tasarım sistemi |
| Durum Yönetimi | TanStack React Query v5 | Sunucu durumu, arka plan senkronizasyonu ve önbellek yönetimi |
| HTTP İstemcisi | Axios | Merkezi interceptor'lar üzerinden otomatik 401 token yenileme |
| İkon Seti | Lucide React | Optimize vektörel ikon kütüphanesi |

---

## Modül Kapsamı ve İşlevsel Özellikler

### 1. Yapay Zeka Müşteri Asistanı (AI Support & RAG)
* **RAG (Retrieval-Augmented Generation) Mimarisi:** Veritabanındaki güncel katalog verileri, stok adetleri, fiyatlar ve mağaza kuralları (14 gün iade, 500 TL üzeri ücretsiz kargo, teslimat süreleri) asistan modeline dinamik bağlam olarak aktarılır.
* **Etkileşimli Ürün Kartları:** Asistan yanıtlarında önerilen ürünler resim, fiyat, doğrudan tek tıkla sepete ekleme ve ürün detayına yönlendirme butonlarıyla zenginleştirilmiş kart bileşenleri olarak sunulur.
* **Akıllı Karşılama ve Sesli Bildirim:** Ziyaretçiyi karşılayan interaktif davet balonu ve asistan yanıtlarıyla eş zamanlı çalışan Web Audio API tabanlı harmonik bildirim tonu.
* **Dayanıklılık ve Yeniden Deneme Mekanizması:** API seviyesinde anlık servis kesintileri veya yoğunluklara karşı üstel gecikmeli (exponential backoff) otomatik yeniden deneme döngüsü.

### 2. Kimlik Denetimi ve Güvenlik Altyapısı (Auth & Security)
* **Rol Hiyerarşisi:** Müşteri (`Customer`) ve Yönetici (`Admin`) yetkilendirmesi.
* **Kademeli Hesap Kilitleme:** Hatalı girişlerde artan bekleme süreleri ve 10 başarısız denemede 24 saat otomatik hesap dondurma.
* **Anlık Token İptali (Token Revocation):**
  * Her token için benzersiz `jti` üretilir; çıkış işlemlerinde token hem Redis hem MemoryCache kara listesine alınır.
  * `JwtBearerEvents.OnTokenValidated` kancası ile geçersiz kılınan token'lar anında reddedilir.
  * `ClockSkew = TimeSpan.Zero` tanımlamasıyla varsayılan 5 dakikalık tolerans süresi kaldırılarak kesin süre denetimi sağlanmıştır.
* **Güvenlik Geçmişi Bilgilendirmesi:** Giriş esnasında kullanıcının önceki başarısız denemelerini tarih, saat ve IP adresleriyle özetleyen bilgilendirme modalı.

### 3. Satış, Sipariş ve Ödeme Akışı (Orders & Checkout)
* **Dinamik Adres Yönetimi:** İl ve ilçe seçicili, varsayılan adres tanımlama ve teslimat adresi doğrulama modülü.
* **Ödeme Güvenliği:** Kart numaraları için Luhn algoritması kontrolü, BIN üzerinden sağlayıcı tespiti (Visa, Mastercard, Troy, Amex) ve 3D etkileşimli kart önizlemesi.
* **İdari Sipariş Yönetimi:** Sipariş kodu, müşteri unvanı, e-posta ve teslimat adresine göre filtrelenebilen, sayfalama destekli sipariş takip tablosu.
* **Durum Değişim Döngüsü:** Sipariş durumlarının (Ödendi, Hazırlanıyor, Kargoda, Teslim Edildi, İptal) tek tıkla güncellenmesi.

### 4. Katalog, Stok ve Çoklu Görsel Yönetimi
* **Görsel Depolama Hattı:** `IFileStorageService` üzerinden 5MB dosya boyutu ve MIME tipi denetimi yapılan yerel depolama altyapısı; sürükle-bırak desteği ve harici CDN URL entegrasyonu.
* **Güvenli Görsel Gösterimi (SafeImage):** Eksik veya ulaşılamayan görseller için otomatik çift kademeli yedekleme (fallback) sistemi.
* **Varyant ve Envanter:** Beden, renk ve numara varyantları; SKU, stok adedi ve fiyat takibi.
* **Kritik Stok Takibi:** Stoğu 30 adedin altına inen ürünler için yönetim panelinde anlık uyarı listesi.

### 5. Kupon ve Promosyon Motoru
* Yüzdelik (%) ve Sabit Tutar (TL) indirim modelleri.
* Kupon kullanım kotası, minimum sepet tutarı ve geçerlilik tarihi kısıtları.
* Sepet ve ödeme aşamalarında anlık kupon doğrulama ve sepet indirimi hesaplaması.

---

## Kurulum ve Dağıtım Adımları

### 1. Gereksinimler
* .NET 8 SDK
* Node.js (v20 veya üzeri) ve npm
* Docker Desktop

### 2. Veritabanı ve Önbellek Servislerinin Başlatılması
Proje kök dizininde bulunan Docker Compose konfigürasyonunu çalıştırın:

```bash
docker compose up -d
```

Bağlantı Noktaları:
* PostgreSQL: `localhost:5432`
* Redis: `localhost:6379`
* pgAdmin: `localhost:5050`

### 3. Backend API Servisinin Çalıştırılması
```bash
dotnet restore
dotnet run --project src/Nexora.Api
```

* API Adresi: `http://localhost:5285`
* Swagger Arayüzü: `http://localhost:5285/swagger`

### 4. Müşteri Vitrin Uygulamasının Başlatılması (Nexora.Web)
```bash
cd src/Nexora.Web
npm install
npm run dev
```

* Web Arayüzü: `http://localhost:5173`

### 5. İdari Yönetim Portalının Başlatılması (Nexora.Admin)
```bash
cd src/Nexora.Admin
npm install
npm run dev
```

* Yönetim Arayüzü: `http://localhost:5174`
* Varsayılan Yönetici Hesabı: `admin@nexora.com` / `Admin123*`

---

## Kodlama Standartları ve Kalite Kriterleri

* Katmanlı mimari kuralları eksiksiz uygulanmalı, Controller sınıfları yalnızca istek karşılama ve yönlendirme ile sınırlandırılmalıdır.
* Veritabanı sorgularında performans öncelikli tutulmalı; projeksiyon ve filtrelemeler veritabanı motoru üzerinde çalıştırılmalıdır.
* TypeScript tarafında tip gevşekliğine (`any`) izin verilmez; katı tip denetimi zorunludur.
* Derleme, paketleme ve çalışma zamanı adımlarında hata ve uyarı bulunmamalıdır.
