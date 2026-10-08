# Nexora Kurumsal E-Ticaret ve Yönetim Platformu

[![Güvenlik ve Kalite Taraması](https://github.com/unsalgel/Nexora/actions/workflows/security-scan.yml/badge.svg?branch=master)](https://github.com/unsalgel/Nexora/actions/workflows/security-scan.yml)
[![Clean Architecture & SOLID](https://img.shields.io/badge/Architecture-NetArchTest_Verified-blue.svg)](https://github.com/unsalgel/Nexora/blob/master/tests/Nexora.UnitTests/Architecture/ArchitectureTests.cs)
[![Lisans: MIT](https://img.shields.io/badge/Lisans-MIT-green.svg)](LICENSE)
[![.NET Sürümü](https://img.shields.io/badge/.NET-8.0-512BD4.svg?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React & TypeScript](https://img.shields.io/badge/Frontend-React_18_%7C_TypeScript-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Güvenlik Politikası](https://img.shields.io/badge/Security-Policy_Active-success.svg?logo=shield&logoColor=white)](https://github.com/unsalgel/Nexora/security/policy)

Nexora; Clean Architecture, CQRS (Command Query Responsibility Segregation) ve SOLID prensipleri doğrultusunda geliştirilmiş, yüksek performans ve kurumsal güvenlik standartlarına sahip tam kapsamlı bir e-ticaret platformudur.

Platform; müşteri vitrini (`Nexora.Web`), yönetim portalı (`Nexora.Admin`) ve merkezi REST API servisinden (`Nexora.Api`) meydana gelmektedir.

---

## Mimari Tasarım ve Prensipler

Proje, iş kurallarının ve çekirdek varlıkların dış bağımlılıklardan tamamen izole edildiği Clean Architecture prensipleriyle yapılandırılmıştır.

```
Nexora/
├── src/
│   ├── Nexora.Domain/         # Çekirdek varlıklar (Entities), enumlar ve özel hata tipleri (Exceptions)
│   ├── Nexora.Application/    # CQRS komut ve sorguları (MediatR), DTO'lar, FluentValidation kuralları
│   ├── Nexora.Infrastructure/ # Güvenlik (JWT, BCrypt, Token Blacklist), E-Posta (SMTP), AI Asistanı, Yerel Dosya Depolama
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
| Gerçek Zamanlı İletişim | ASP.NET Core SignalR | Anlık sipariş bildirimleri ve site ayarları senkronizasyonu |
| Doğrulama | FluentValidation | İstek gövdeleri için kural tabanlı doğrulama altyapısı |
| Loglama | Serilog | Yapılandırılmış loglama; Console ve günlük dönen dosya çıktıları |
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
* **Prompt İzolasyonu ve Enjeksiyon Koruması:** Kullanıcı mesajları ve geçmiş konuşmalar XML sınır etiketleri (`<gecmis_konusma>`, `<asistan>`, `<musteri>`) içerisine izole edilir; 1000 karakterlik hız sınırlaması ve sistem rolünden sapmayı engelleyen katı güvenlik kuralları uygulanır.
* **Güvenli API İletişimi:** Google Gemini API anahtarı URL parametrelerinde değil, `x-goog-api-key` HTTP istek başlığında taşınarak log sızıntıları engellenir.
* **Dayanıklılık ve Yeniden Deneme Mekanizması:** API seviyesinde anlık servis kesintileri veya yoğunluklara karşı üstel gecikmeli (exponential backoff) otomatik yeniden deneme döngüsü.

### 2. Kimlik Denetimi ve Güvenlik Altyapısı (Auth & Security)
* **Rol Hiyerarşisi ve Yetki Yükseltme Koruması:** Müşteri (`Customer`) ve Yönetici (`Admin`) yetkilendirmesi; rol ve kullanıcı durumu yönetim uç noktalarında katı `[Authorize(Roles = "Admin")]` denetimi.
* **Son Yönetici Koruması (Last Admin Invariant):** Sistemdeki tek aktif yöneticinin Admin rolünün kaldırılması veya hesabının pasife alınması `ConflictException` ile engellenir; sistemin sahipsiz kalması önlenir.
* **OAuth 2.0 Refresh Token Aile İptali (Reuse Detection):** İptal edilmiş veya süresi geçmiş bir refresh token yeniden kullanılmaya çalışıldığında, ilgili kullanıcıya ait tüm aktif oturumlar ve token aileleri anında geçersiz kılınır.
* **Zamanlama Saldırısı Koruması (Constant-Time Verification):** Kullanıcı adı veya e-posta bulunamadığında dahi sahte karma doğrulama çalıştırılarak kullanıcı numaralandırma ve yanıt süresi analizi (timing attack) engellenir.
* **Kademeli Hesap Kilitleme:** Hatalı girişlerde artan bekleme süreleri ve 10 başarısız denemede 24 saat otomatik hesap dondurma.
* **Anlık Token İptali (Token Revocation):**
  * Her token için benzersiz `jti` üretilir; çıkış ve hesap dondurma işlemlerinde token'lar hem Redis hem MemoryCache kara listesine alınır.
  * `JwtBearerEvents.OnTokenValidated` kancası ile geçersiz kılınan token'lar anında reddedilir.
  * `ClockSkew = TimeSpan.Zero` tanımlamasıyla varsayılan 5 dakikalık tolerans süresi kaldırılarak kesin süre denetimi sağlanmıştır.
* **Güvenlik Geçmişi Bilgilendirmesi:** Giriş esnasında kullanıcının önceki başarısız denemelerini tarih, saat ve IP adresleriyle özetleyen bilgilendirme modalı.

### 3. Satış, Sipariş ve Ödeme Akışı (Orders & Checkout)
* **Dinamik Adres Yönetimi:** İl ve ilçe seçicili, varsayılan adres tanımlama ve teslimat adresi doğrulama modülü.
* **Ödeme Güvenliği:** Kart numaraları için Luhn algoritması kontrolü, BIN üzerinden sağlayıcı tespiti (Visa, Mastercard, Troy, Amex) ve 3D etkileşimli kart önizlemesi.
* **İdari Sipariş Yönetimi:** Sipariş kodu, müşteri unvanı, e-posta ve teslimat adresine göre filtrelenebilen, sayfalama destekli sipariş takip tablosu.
* **Durum Değişim Döngüsü:** Sipariş durumlarının (Ödendi, Hazırlanıyor, Kargoda, Teslim Edildi, İptal) tek tıkla güncellenmesi.

### 4. Katalog, Stok ve Çoklu Görsel Yönetimi
* **Binary Magic-Byte Başlık Doğrulaması:** Dosya uzantısı ve MIME tipi manipülasyonlarına karşı JPEG (`FF D8 FF`), PNG (`89 50 4E 47`) ve WEBP (`52 49 46 46`) binary sihirli bayt doğrulaması (`LocalFileStorageService`).
* **PostgreSQL İyimser Eşzamanlılık (Optimistic Concurrency):** Eş zamanlı stok güncellemelerinde kayıp güncellemeleri (lost update) engellemek amacıyla yerel `xmin` sistem tokeni kullanılır.
* **Güvenli Görsel Gösterimi (SafeImage):** Eksik veya ulaşılamayan görseller için otomatik çift kademeli yedekleme (fallback) sistemi.
* **Varyant ve Envanter:** Beden, renk ve numara varyantları; SKU, stok adedi ve fiyat takibi.
* **Kritik Stok Takibi:** Stoğu 5 adedin altına inen ürünler için yönetim grubuna özel anlık düşük stok alarmları.

### 5. Kupon ve Promosyon Motoru
* Yüzdelik (%) ve Sabit Tutar (TL) indirim modelleri.
* Kupon kullanım kotası, minimum sepet tutarı ve geçerlilik tarihi kısıtları.
* Yarış durumlarına (race condition) ve eşzamanlı kupon tüketimine karşı `xmin` token koruması.
* Sepet ve ödeme aşamalarında anlık kupon doğrulama ve sepet indirimi hesaplaması.

### 6. Kullanıcı & Rol Yönetimi (Users & Roles)
* Admin paneli üzerinden tüm müşterilerin ve yöneticilerin aranması, filtrelenmesi ve sayfalanması.
* Kullanıcı hesap durumunun (Aktif/Pasif) tek tıkla güncellenmesi ve pasife alınan kullanıcının tüm oturumlarının anında düşürülmesi.
* Güvenli dinamik rol atama ve son yönetici denetimi.

### 7. Ürün Değerlendirme ve Yorum Yönetimi (Reviews)
* **Doğrulanmış Satın Alma (Verified Purchase):** Yalnızca ürünü satın almış kullanıcıların değerlendirme ve yorum ekleyebilmesi (`BusinessValidationException`).
* **Kural Tabanlı Doğrulama:** 1 ile 5 arası puan aralığı ve maksimum 1000 karakterlik yorum sınırlaması (FluentValidation).
* Ürün detayında gerçek zamanlı puan ortalaması ve yorum listeleme.
* Admin panelinde yorumları puan ve metne göre arama, filtreleme ve moderasyon (silme).

### 8. Gerçek Zamanlı Bildirim & Ticari Veri İzolasyonu (SignalR Real-time Hub)
* **Ticari Veri İzolasyonu:** Sipariş tutarları, müşteri bilgileri ve düşük stok uyarıları genel soketlere değil, yalnızca `Admins` grubuna yayınlanır (`PublishToAdminsAsync`).
* **Otomatik İdari Grup Kaydı:** `AppHub` bağlantı sağlandığında JWT rolü `Admin` olan istemcileri otomatik olarak `Admins` grubuna dahil eder.
* Müşteriye özel sipariş durumu güncellemeleri yalnızca ilgili kullanıcının kanalına (`PublishToUserAsync`) iletilir.
* Site ayarları (duyuru metni, iletişim bilgileri vb.) güncellendiğinde tüm aktif kullanıcılarda anında yansıyan canlı güncelleme altyapısı.

### 9. Kurumsal Siber Güvenlik, DevOps ve Altyapı
* **Ters Proxy Gerçek IP Çözümlemesi:** Nginx/Traefik arkasındaki dağıtımlarda gerçek istemci IP ve HTTPS şemasını çözmek için `UseForwardedHeaders` middleware'i etkindir.
* **Hangfire Dashboard Sıkılaştırması:** Yerel loopback IP bypass erişimi yalnızca `Development` ortamına sınırlandırılmıştır; canlıda Admin rolü zorunludur.
* **Sağlık Denetimleri (Health Checks):** Kapsayıcı orkestrasyonu (Kubernetes/Docker) için `/health/live`, `/health/ready` ve `DatabaseHealthCheck` uç noktaları.
* **Root Yetkisiz Konteynerleştirme:** Üretim ortamı için en az yetkili `appuser` ile çalışan multi-stage `Dockerfile` ve gereksiz dosyaları arındıran `.dockerignore`.
* **CI/CD Gizli Anahtar Taraması (Gitleaks):** PR ve push süreçlerinde çalışan, `GITHUB_TOKEN` ile PR farklarını tarayan ve gizli anahtar tespitinde pipeline'ı kıran (`fail-closed`) güvenlik adımı.
* **Güvenlik Başlıkları:** Clickjacking engeli (`X-Frame-Options: DENY`), MIME sniffing engeli (`X-Content-Type-Options: nosniff`), XSS koruması, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` ve katı `Content-Security-Policy (CSP)`.
* **Zorunlu HTTPS & HSTS:** Üretim ortamında zorunlu HTTPS yönlendirmesi ve 1 yıllık `Strict-Transport-Security` (HSTS).
* **Ortama Duyarlı Güvenli CORS:** Geliştirme ortamında esnek yerel portlar, canlı ortamda yalnızca güvenli Web & Admin alan adlarını kapsayan whitelist.
* **Global Hata Yakalama (Global Error Boundary):** Web ve Admin taraflarında beklenmeyen React çalışma zamanı çökmelerini engelleyen kurumsal `ErrorBoundary` ve kurtarma bileşenleri.
* **CI/CD Güvenlik & SAST Boru Hattı:** GitHub Actions üzerinde çalışan CodeQL Statik Analizi (`queries: security-extended`), Dependency Review ve Gitleaks gizli anahtar taraması.

---

## Kurulum ve Dağıtım Adımları

### 1. Gereksinimler
* .NET 8 SDK
* Node.js (v20 veya üzeri) ve npm
* Docker Desktop

### 2. Ortam Değişkenleri ve Veritabanı Servisleri
Örnek ortam değişkenleri dosyasını kopyalayarak yerel `.env` dosyanızı oluşturun:

```bash
cp .env.example .env
```

Ardından Docker Compose ile yerel altyapı servislerini (PostgreSQL, Redis, pgAdmin) başlatın:

```bash
docker compose up -d
```

Servis Bağlantı Noktaları *(Güvenlik amacıyla yalnızca yerel `127.0.0.1` erişimine bağlıdır)*:
* PostgreSQL: `127.0.0.1:5432`
* Redis (Parola korumalı): `127.0.0.1:6379`
* pgAdmin: `127.0.0.1:5050`

### 3. Backend API Servisinin Çalıştırılması
```bash
dotnet restore
dotnet run --project src/Nexora.Api
```

* API Adresi: `http://localhost:5285`
* Swagger Arayüzü: `http://localhost:5285/swagger`
* Canlılık Denetimi (Liveness): `http://localhost:5285/health/live`
* Hazırlık Denetimi (Readiness): `http://localhost:5285/health/ready`

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
* Yerel Test Yönetici Hesabı (Seeder): `admin@nexora.com` / `Admin123*` *(Yalnızca yerel `Development` ortamında otomatik tohumlanır)*

### 6. Güvenlik ve Test Denetimi
```bash
# Backend birim ve mimari testleri (93 test - %100 Başarılı)
dotnet test

# .NET paket zafiyet taraması
dotnet list package --vulnerable --include-transitive

# Frontend güvenlik denetimleri
cd src/Nexora.Web && npm audit --audit-level=high
cd src/Nexora.Admin && npm audit --audit-level=high
```

---

## Kodlama Standartları ve Kalite Kriterleri

* Katmanlı mimari kuralları eksiksiz uygulanmalı, Controller sınıfları yalnızca istek karşılama ve yönlendirme ile sınırlandırılmalıdır.
* Veritabanı sorgularında performans öncelikli tutulmalı; projeksiyon ve filtrelemeler veritabanı motoru üzerinde çalıştırılmalıdır.
* TypeScript tarafında tip gevşekliğine (`any`) izin verilmez; katı tip denetimi zorunludur.
* Derleme, paketleme ve çalışma zamanı adımlarında hata ve uyarı bulunmamalıdır.
* Güvenlik açıklarına (SQLi, XSS, CSRF, IDOR, MIME-sniffing, Clickjacking) karşı kodlama standartları tavizsiz korunur.
