# 🛍️ Nexora.Web — Müşteri Paneli (Frontend)

Nexora E-Ticaret Platformu müşteri web uygulaması. React 18, TypeScript, Vite ve Tailwind CSS teknolojileri ile geliştirilmiş modern, hızlı ve duyarlı (responsive) bir e-ticaret arayüzüdür.

---

## 🚀 Kullanılan Teknolojiler

| Kategori | Teknoloji |
|---|---|
| **Framework** | React 18+ |
| **Dil** | TypeScript (Strict Mode) |
| **Build Tool** | Vite |
| **Stil / Tasarım** | Tailwind CSS v4, PostCSS, Lucide React (İkonlar) |
| **Yönlendirme** | React Router v6 |
| **Sunucu Durumu (State)** | TanStack Query (React Query v5) |
| **Lokal Durum Yönetimi** | Context API (`CartContext`, `FavoritesContext`) |
| **HTTP İstemcisi** | Axios (Otomatik 401 Silent Refresh & JWT Bearer Interceptors) |

---

## 📁 Proje Klasör Yapısı

```
src/
├── components/          # Paylaşılan UI Bileşenleri
│   ├── layout/          # Navbar, Footer
│   └── ui/              # Atomik Buton, Input, Modal vb.
├── context/             # Global Durum Context'leri (CartContext, FavoritesContext)
├── lib/                 # Axios İstemcisi & JWT Yardımcıları (apiClient.ts, jwt.ts)
├── pages/               # Route Sayfaları (HomePage, ProductsPage, ProductDetailPage, CartPage, CheckoutPage, ProfilePage, LoginPage, RegisterPage)
├── types/               # TypeScript Tip Tanımları
├── App.tsx              # Ana Uygulama & Provider'lar
├── index.css            # Global CSS & Tailwind Ayarları
└── main.tsx             # Giriş Noktası
```

---

## 🛠️ Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükleyin
```bash
npm install
```

### 2. Geliştirme Sunucusunu Başlatın (Dev Mode)
```bash
npm run dev
```

Uygulama varsayılan olarak `http://localhost:5173` adresinde çalışacaktır.

### 3. Production Build Alın
```bash
npm run build
```

---

## 🔗 Backend API Bağlantısı

Uygulama, `http://localhost:5285/api` adresinde çalışan **Nexora.Api** (.NET 8 Web API) servisine bağlıdır.
- `src/lib/apiClient.ts` dosyası JWT Access Token'ları otomatik olarak isteklere ekler.
- `401 Unauthorized` durumunda kullanıcıyı login'e atmadan arka planda otomatik refresh token ile oturumu yeniler.
