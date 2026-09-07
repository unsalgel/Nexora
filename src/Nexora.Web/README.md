# Nexora.Web — Müşteri Mağazası

Nexora E-Ticaret Platformu müşteri web uygulamasıdır. React 19, TypeScript, Vite ve Tailwind CSS teknolojileri ile geliştirilmiş modern, hızlı ve duyarlı (responsive) bir e-ticaret arayüzüdür.

---

## Kullanılan Teknolojiler

| Kategori | Teknoloji / Kütüphane | Açıklama |
|---|---|---|
| Çekirdek | React 19+ | Modern fonksiyonel bileşen mimarisi |
| Dil | TypeScript | Strict mode tip güvenliği |
| Paketleme Aracı | Vite | Hızlı yerel geliştirme ve optimize bundle |
| Tasarım ve Stil | Tailwind CSS v4, Lucide React | Modern utility-first CSS ve hafif SVG ikonlar |
| Yönlendirme | React Router v7 | Deklaratif sayfa yönlendirme altyapısı |
| Sunucu Durumu | TanStack React Query v5 | Veri getirme, önbellek ve otomatik arka plan tazeleme |
| Yerel Durum Yönetimi | Context API | Sepet (`CartContext`) ve Favoriler (`FavoritesContext`) |
| Ödeme Doğrulaması | Luhn Algoritması | Otomatik kart sağlayıcı tespiti ve geçerlilik kontrolü |
| HTTP İstemcisi | Axios | Otomatik JWT Bearer ekleme ve 401 sessiz token yenileme |

---

## Öne Çıkan Özellikler

### 1. Kupon ve Promosyon Motoru
* Sepet ekranında anlık kupon kodu doğrulama.
* Dinamik indirim hesaplaması (Yüzdelik veya Sabit Tutar).
* Minimum sepet tutarı ve kullanım limiti denetimi.

### 2. Güvenli Ödeme ve 3D Kart Görselleştirmesi
* Luhn algoritması ile anlık kart numarası kontrolü.
* Girilen ilk hanelere göre otomatik kart markası algılama (Visa, Mastercard, Troy, American Express).
* Kart arkası çevrilerek CVV alanının doldurulduğu etkileşimli 3D kart animasyonu.

### 3. Popover Bildirim Menüsü
* Ekranı karartmadan zil ikonunun altına doğrudan açılan popover menüsü (`NotificationDropdown`).
* Sipariş, kargo ve ödeme bildirimlerini tek tıkla okundu olarak işaretleme.

### 4. Küresel Katalog Arama ve Filtreleme
* Navbar üzerinden ürün adı, marka veya SKU ile arama.
* URL parametresi (`/products?search=...`) entegrasyonu ile sayfalandırılabilir filtreleme.
* Kategori ve marka bazlı dinamik filtreler, fiyat aralığı seçimi.

### 5. Favoriler ve Kullanıcı Etkileşimi
* Tek tıkla ürünleri favorilere ekleme veya çıkarma.
* Profil sayfasında favorilenen ürünleri ve sipariş geçmişini görüntüleme.
* İncelenen ürünlere 1-5 yıldız puan verme ve yorum yapma olanağı.

---

## Proje Klasör Yapısı

```
src/
├── components/          # Paylaşılan UI bileşenleri
│   ├── auth/            # Giriş, kayıt ve korumalı rota bileşenleri
│   ├── layout/          # Navbar, Footer, NotificationDropdown
│   └── ui/              # Buton, modal, bildirim kutuları
├── context/             # Global durum sağlayıcıları (CartContext, FavoritesContext)
├── lib/                 # Axios istemcisi, kart doğrulama ve yardımcı araçlar
├── pages/               # Rota sayfaları (HomePage, ProductsPage, ProductDetailPage, CartPage, CheckoutPage vb.)
├── types/               # TypeScript arayüz ve tip tanımları
├── App.tsx              # Uygulama ana gövdesi ve route yapılandırması
├── index.css            # Global stil ve Tailwind yönergeleri
└── main.tsx             # Uygulama başlangıç noktası
```

---

## Kurulum ve Çalıştırma

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın (Port: 5173)
npm run dev

# Tip denetimi ve üretim derlemesi
npm run build
```
