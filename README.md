# 🚀 Nexora — Kurumsal E-Ticaret Platformu

Nexora, Clean Architecture, DDD ve CQRS prensiplerine uygun olarak geliştirilmiş; yüksek performanslı, ölçeklenebilir ve güvenli bir e-ticaret platformudur.

---

## 🏗️ Genel Mimari Yapısı

Proje, **Clean Architecture** (Temiz Mimari) ilkelerine tam uyumlu olarak 5 temel katmandan oluşmaktadır:

```
Nexora/
├── src/
│   ├── Nexora.Domain/         # Core Domain Entities, Enums, Value Objects, Domain Exceptions
│   ├── Nexora.Application/    # CQRS (MediatR), DTO'lar, Validation (FluentValidation), Behaviors
│   ├── Nexora.Infrastructure/ # Security (JWT, BCrypt), External Services (Payment)
│   ├── Nexora.Persistence/    # EF Core (Code-First), PostgreSQL Configurations, DbContext
│   ├── Nexora.Api/            # ASP.NET Core Web API, Controllers, Middleware, Serilog
│   └── Nexora.Web/            # React 18 + TypeScript + Vite + Tailwind Client (Müşteri Paneli)
└── Nexora.sln
```

---

## 🛠️ Teknoloji Yığını (Tech Stack)

### ⚙️ Backend (.NET 8 Web API)
- **Framework:** .NET 8 (LTS), ASP.NET Core Web API
- **Mimari Desenler:** Clean Architecture, CQRS (MediatR 12), Result Pattern
- **Veritabanı & ORM:** PostgreSQL, Entity Framework Core 8 (Code-First, Fluent API)
- **Doğrulama (Validation):** FluentValidation (MediatR Pipeline Behavior)
- **Güvenlik & Auth:** JWT (Access Token 15 dk + Refresh Token 7 gün), BCrypt Password Hashing
- **Loglama & İzlenebilirlik:** Serilog (PostgreSQL Sink + Daily Rolling File + Console)
- **Performans İzleme:** `LoggingBehavior` (500ms üzeri yavaş istekleri otomatik uyarma)
- **Dokümantasyon:** Swagger / OpenAPI (JWT Bearer destekli)

### 💻 Frontend (React + TypeScript)
- **Framework & Build:** React 18, TypeScript, Vite
- **Stil & Tasarım:** Tailwind CSS v4, Glassmorphism, Responsive (Mobil Uyumlu)
- **State & Server State:** TanStack Query v5 (React Query)
- **HTTP İstemcisi:** Axios (Merkezi `apiClient.ts` - Otomatik Bearer Token Interceptor)
- **Yönlendirme:** React Router v6

---

## 📦 Tamamlanan V1 Backend Modülleri

| # | Modül Adı | Açıklama |
|---|---|---|
| 1 | **Auth & Authorization** | Register, Login, Refresh Token, Revoke Token, JWT Güvenliği |
| 2 | **Category** | Kategori ekleme, listeleme, güncelleme, silme (Admin / Public) |
| 3 | **Brand** | Marka yönetimi (Admin / Public) |
| 4 | **Product & Images** | Ürün yönetimi, resim ekleme/silme, soft-delete, filtreli listeleme |
| 5 | **Product Variants** | SKU, stok ve fiyat bazlı varyant (renk, beden vb.) yönetimi |
| 6 | **Favorites** | Kullanıcı favori ürün ekleme, çıkarma ve sayfalı listeleme |
| 7 | **Cart** | Kullanıcı sepet yönetimi (ürün ekleme, miktar güncelleme, temizleme) |
| 8 | **Order & Payment** | Sipariş oluşturma, `FakePaymentService` ödeme simülasyonu, stok düşümü |
| 9 | **Notification** | Otomatik sipariş/ödeme durum bildirimleri, okundu işaretleme |
| 10 | **Logging System** | PostgreSQL `Logs` tablosuna tarih/saat damgalı izlenebilir loglama |

---

## 🚀 Projeyi Çalıştırma

### 1. Veritabanı ve Connection String
`src/Nexora.Api/appsettings.json` dosyasındaki connection string'i PostgreSQL sunucunuza göre ayarlayın:
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=NexoraDb;Username=postgres;Password=postgres"
}
```

### 2. Backend API'yi Çalıştırma
```bash
dotnet restore
dotnet run --project src/Nexora.Api
```
- API adresi: `http://localhost:5000` (veya `https://localhost:5001`)
- Swagger Dokümantasyonu: `http://localhost:5000/swagger`

### 3. Frontend (Müşteri Paneli) Çalıştırma
```bash
cd src/Nexora.Web
npm install
npm run dev
```
- Frontend adresi: `http://localhost:5173`

---

## 🛡️ Güvenlik ve Standartlar
- **CORS:** API katmanında tanımlı esnek CORS politikası.
- **Data Protection:** Hiçbir şifre düz metin saklanmaz.
- **Audit Logging:** Tüm veritabanı kayıtları `CreatedAtUtc` ve `UpdatedAtUtc` tarihleri ile UTC formatında otomatik damgalanır.
- **Response Wrapper:** Tüm API yanıtları standart `Result<T>` yapısında dönmektedir.
