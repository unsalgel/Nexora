# 🛍️ Nexora.Web — Müşteri Paneli (Frontend)

Nexora E-Ticaret Platformu müşteri web uygulaması. React 19, TypeScript, Vite ve Tailwind CSS teknolojileri ile geliştirilmiş modern, hızlı ve duyarlı (responsive) bir e-ticaret arayüzüdür.

---

## 🚀 Kullanılan Teknolojiler

| Kategori | Teknoloji |
|---|---|
| **Framework** | React 19+ |
| **Dil** | TypeScript (Strict Mode) |
| **Build Tool** | Vite |
| **Stil / Tasarım** | Tailwind CSS v4, PostCSS, Lucide React (İkonlar) |
| **Yönlendirme** | React Router v6 |
| **Sunucu Durumu (State)** | TanStack Query (React Query v5) |
| **Lokal Durum Yönetimi** | Context API (`CartContext`, `FavoritesContext`) |
| **Ödeme & Kart Validasyonu** | Luhn Algoritması & Otomatik Kart Markası Algılama (`cardValidation.ts`) |
| **HTTP İstemcisi** | Axios (Otomatik 401 Silent Refresh & JWT Bearer Interceptors) |

---

## ✨ Öne Çıkan Özellikler

1. **🎟️ Kupon & Promosyon Sistemi:** Sepette anlık kupon kodu doğrulama, dinamik indirim hesabı ve indirimli sipariş oluşturma.
2. **💳 Güvenli Ödeme & 3D Kart:** Luhn algoritması denetimi, otomatik Visa / Mastercard / Troy / Amex kart logosu tespiti, 3D çevrilen kart animasyonu.
3. **🔔 Popover Bildirim Menüsü:** Ekranı karartmadan zilin tam altına açılan `NotificationDropdown.tsx` menüsü ve tek tıkla okundu işaretleme.
4. **🔍 Navbar Genel Arama:** Enter veya butonla `/products?search=...` yönlendirmesi ve URL parametresiyle anlık katalog filtreleme.

---

## 📁 Proje Klasör Yapısı

```
src/
├── components/          # Paylaşılan UI Bileşenleri
│   ├── layout/          # Navbar, Footer, NotificationDropdown
│   └── ui/              # Atomik Buton, SearchableSelect vb.
├── context/             # Global Durum Context'leri (CartContext, FavoritesContext)
├── lib/                 # Axios İstemcisi, Kart Validasyonu & JWT (apiClient.ts, cardValidation.ts, jwt.ts)
├── pages/               # Route Sayfaları (HomePage, ProductsPage, ProductDetailPage, CartPage, CheckoutPage, ProfilePage, LoginPage, RegisterPage, OrdersPage)
├── types/               # TypeScript Tip Tanımları (coupon.ts, order.ts, product.ts vb.)
├── App.tsx              # Ana Uygulama & Provider'lar
├── index.css            # Global CSS & Tailwind Ayarları
└── main.tsx             # Giriş Noktası
```

---

## 🛠️ Kurulum ve Çalıştırma

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat (Port: 5173)
npm run dev

# Production Build kontrolü
npm run build
```
