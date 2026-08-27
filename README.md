# 🚀 Nexora — Kurumsal E-Ticaret ve Yönetim Platformu

Nexora; Clean Architecture, Domain-Driven Design (DDD) ve CQRS prensiplerine tam uyumlu olarak geliştirilmiş; yüksek performanslı, ölçeklenebilir, modern ve güvenli bir e-ticaret platformudur.

---

## 🏗️ Genel Mimari Yapısı

Proje, **Clean Architecture** (Temiz Mimari) ilkelerine tam uyumlu olarak backend ve modern frontend katmanlarından oluşmaktadır:

```
Nexora/
├── src/
│   ├── Nexora.Domain/         # Core Domain Entities, Enums, Value Objects, Domain Exceptions
│   ├── Nexora.Application/    # CQRS (MediatR), DTO'lar, Validation (FluentValidation), Behaviors
│   ├── Nexora.Infrastructure/ # Security (JWT, BCrypt), External Services (Payment)
│   ├── Nexora.Persistence/    # EF Core 8 (Code-First), PostgreSQL Configurations, DbContext
│   ├── Nexora.Api/            # ASP.NET Core Web API, Controllers, Middleware, Serilog
│   ├── Nexora.Web/            # React 19 + TypeScript + Vite + Tailwind Client (Müşteri Mağazası)
│   └── Nexora.Admin/          # React 19 + TypeScript + Vite + Tailwind Portal (Yönetici Paneli)
└── Nexora.sln
```

---

## 🛠️ Teknoloji Yığını (Tech Stack)

### ⚙️ Backend (.NET 8 Web API)
- **Framework:** .NET 8 (LTS), ASP.NET Core Web API
- **Mimari Desenler:** Clean Architecture, CQRS (MediatR 12), Result Pattern, Ubiquitous Language
- **Veritabanı & ORM:** PostgreSQL, Entity Framework Core 8 (Code-First, Fluent API, Optimize Projeksiyonlar)
- **Önbellek (Caching):** Redis Entegrasyonu
- **Doğrulama (Validation):** FluentValidation (MediatR Pipeline Behavior)
- **Güvenlik & Auth:** JWT (Access Token 15 dk + Refresh Token 7 gün), BCrypt Password Hashing, Rol Tabanlı Güvenlik (`Admin`, `Customer`)
- **Loglama & İzlenebilirlik:** Serilog (PostgreSQL Sink + Daily Rolling File + Console)
- **Performans İzleme:** `LoggingBehavior` (500ms üzeri yavaş istekleri otomatik uyarma)
- **Dokümantasyon:** Swagger / OpenAPI (JWT Bearer destekli)

### 💻 Frontend Uygulamaları (React + TypeScript)
- **Nexora.Web (Müşteri Mağazası - Port 5173):** React 19, TypeScript, Tailwind CSS v4, Lucide İkonlar, TanStack Query v5, Context API (`CartContext`, `FavoritesContext`).
- **Nexora.Admin (Yönetim Portalı - Port 5174):** React 19, TypeScript, Tailwind CSS v4, TanStack Query v5 (`keepPreviousData` akıcı filtreleme), Lucide React.
- **HTTP İstemcisi:** Axios (Merkezi `apiClient.ts` - Otomatik Bearer Token & 401 Silent Refresh Interceptor)

---

## 📦 Tamamlanan Backend & Frontend Modülleri

| # | Modül Adı | Backend Kapsamı | Frontend & Admin Entegrasyonu |
|---|---|---|---|
| 1 | **Auth & Authorization** | Register, Login, Refresh Token, Revoke Token, Rol Güvenliği | Müşteri Giriş/Kayıt + Admin Özel Giriş (`/login`) |
| 2 | **Admin Dashboard** | Mağaza envanter değeri, toplam sipariş, son siparişler | `DashboardPage.tsx` Canlı İstatistikler & Kritik Stok |
| 3 | **Order Management** | CQRS Sipariş Listeleme, Canlı Durum Değiştirme, Filtreleme | `OrdersPage.tsx` Arama, Filtreleme, Akıllı 24h Yeni Rozeti, Detay Modalı |
| 4 | **Product & Variants** | Ürün ve varyant yönetimi (SKU, stok, fiyat), galeri | Müşteri Kataloğu + Admin Ürün Ekleme/Düzenleme & Aktif/Pasif Switch |
| 5 | **Category & Brand** | 5 Ana Kategori ve Dağıtıcı Markaların Yönetimi | Dinamik Navbar, Filtreleme, Admin Listeleri & Aktif/Pasif Toggle |
| 6 | **Cart & Checkout** | Sepet yönetimi, stok rezervasyonu, Luhn validasyonu | `CartPage.tsx`, `CheckoutPage.tsx` 3D Canlı Kart & Marka Algılama |
| 7 | **Coupon System** | Kupon doğrulama, indirim hesabı, kullanım limiti takibi | `CouponsPage.tsx` Kupon oluşturma, limit çubuğu & Checkout indirimi |
| 8 | **Favorites** | Kullanıcı favori ürün ekleme, çıkarma ve listeleme | `FavoritesContext.tsx`, `ProfilePage.tsx` |
| 9 | **Reviews & Ratings** | Ürün puanlama (1-5 yıldız), yorum yazma ve listeleme | `ProductDetailPage.tsx` Yorum ve Değerlendirme Formu |
| 10 | **Notifications** | Otomatik sipariş/ödeme/kargo bildirimleri | Zilin altına açılan `NotificationDropdown.tsx` Popover Menüsü |
| 11 | **Search System** | Ürün, marka ve SKU bazlı genel arama motoru | Navbar Arama Formu & URL Query Parametreli `ProductsPage.tsx` |
| 12 | **UI & UX Enhancements** | Reusable UI Komponentleri | `ConfirmModal.tsx` (Zarif Onay Penceresi), `ToggleSwitch.tsx` (Durum Switch'i) |

---

## 🚀 Projeyi Çalıştırma

### 1. Veritabanı ve Docker Stack
Docker Compose ile PostgreSQL ve Redis servislerini başlatın:
```bash
docker compose up -d
```

### 2. Backend API'yi Çalıştırma
```bash
dotnet restore
dotnet run --project src/Nexora.Api
```
- API adresi: `http://localhost:5285`
- Swagger Dokümantasyonu: `http://localhost:5285/swagger`

### 3. Müşteri Web Mağazasını Çalıştırma (`Nexora.Web`)
```bash
cd src/Nexora.Web
npm install
npm run dev
```
- Mağaza adresi: `http://localhost:5173`

### 4. Admin Yönetim Portalını Çalıştırma (`Nexora.Admin`)
```bash
cd src/Nexora.Admin
npm install
npm run dev
```
- Admin Paneli: `http://localhost:5174` (Giriş: `admin@nexora.com` / `Admin123!`)

---

## 🛡️ Güvenlik ve Mimari İlkeler
- **Sıfır `any` & Strict Mode:** Tüm projelerde strict TypeScript kuralları uygulanmaktadır.
- **Silent Refresh:** Access Token süresi dolduğunda (401) kullanıcı oturumu kopmadan arkaplanda otomatik yenilenir.
- **Ubiquitous Language:** Frontend ve Backend arasında aynı domain terimleri (`grandTotal`, `payableTotal`, `items`, `status` vb.) kullanılır.
- **Luhn Algorithm Validasyonu:** Kredi kartı doğrulaması güvenli standart Luhn algoritması ile istemci tarafında denetlenir.
- **Soft State / Non-Destructive Management:** Varlıklar doğrudan silinmek yerine `ToggleSwitch` ile pasife alınabilir; veri bütünlüğü korunur.
