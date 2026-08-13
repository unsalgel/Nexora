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
| **HTTP İstemcisi** | Axios |

---

## 📁 Proje Klasör Yapısı

```
src/
├── components/          # Paylaşılan UI Bileşenleri
│   ├── layout/          # Navbar, Footer, Sidebar
│   └── ui/              # Atomik Buton, Input, Modal vb.
├── features/            # Modüler Özellikler (Feature-Based)
│   ├── auth/            # Giriş / Kayıt Ol
│   ├── cart/            # Sepet Yönetimi
│   ├── notifications/   # Müşteri Bildirimleri
│   ├── orders/          # Sipariş Takibi & Ödeme
│   └── products/        # Ürün Kataloğu & Detay
├── lib/                 # Axios İstemcisi & Genel Yardımcılar (apiClient.ts)
├── pages/               # Route Sayfaları (HomePage vb.)
├── routes/              # React Router Yapılandırması
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

Uygulama, `http://localhost:5000/api` adresinde çalışan **Nexora.Api** (.NET 8 Web API) servisine bağlıdır. `src/lib/apiClient.ts` dosyası JWT Access Token'ları otomatik olarak isteklere ekler.
