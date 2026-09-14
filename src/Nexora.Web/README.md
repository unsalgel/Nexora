# Nexora.Web — Müşteri Vitrini

Nexora e-ticaret platformunun son kullanıcı alışveriş deneyimini sunan müşteri vitrini web uygulamasıdır. React, TypeScript, Vite ve Tailwind CSS teknolojileri temelinde tip güvenli ve performans odaklı olarak geliştirilmiştir.

---

## Teknoloji Mimarisi

| Kategori | Teknoloji / Kütüphane | Kullanım Amacı |
|---|---|---|
| Çekirdek Kütüphane | React 19+ | Fonksiyonel bileşen mimarisi ve kanca (hook) yapıları |
| Tip Güvenliği | TypeScript | Strict Mode standartlarında uçtan uca tip güvenliği |
| Paketleme Aracı | Vite | Modüler HMR desteği ve optimize edilmiş üretim paketi |
| Tasarım Sistemi | Tailwind CSS v4 | Kurumsal utility-first stil hiyerarşisi |
| İkonografi | Lucide React | Vektörel SVG ikon seti |
| Rota Yönetimi | React Router v7 | Deklaratif sayfa yönlendirmeleri ve korumalı rotalar |
| Sunucu Durumu | TanStack React Query v5 | Asenkron veri getirme, otomatik önbellek ve yeniden doğrulama |
| Yerel Durum | Context API | Sepet (`CartContext`) ve Favoriler (`FavoritesContext`) yönetimi |
| Ses Motoru | Web Audio API | Dış varlık bağımlılığı olmaksızın sentezlenen arayüz bildirim tonları |
| HTTP İstemcisi | Axios | Merkezi interceptor'lar üzerinden yetkilendirme ve sessiz 401 token yenileme |

---

## Fonksiyonel Modüller

### 1. Yapay Zeka Müşteri Asistanı (Nexora Asistan)
* **Zenginleştirilmiş Yanıt Kartları:** Asistan önerilerinde ürün görseli, güncel fiyatı, sepete ekleme butonu ve ürün detayına doğrudan yönlendirme bağlantısı içeren kart bileşenleri.
* **Hızlı Öneri Başlıkları:** Popüler ürünler, teslimat süreleri ve iade şartlarına yönelik tek tıkla soru sorma butonları.
* **Akıllı Karşılama Balonu:** Ziyaretçinin siteye girişinden kısa süre sonra açılan interaktif yardım daveti.
* **Senkronize Sesli Bildirim:** Asistan yanıtının ekrana yansıdığı milisaniyede devreye giren Web Audio API tabanlı harmonik bildirim sesi.
* **Oturum ve Geçmiş Kalıcılığı:** Tarayıcı yerel depolaması (`localStorage`) üzerinde konuşma geçmişinin korunması ve tek tıkla sıfırlanabilmesi.

### 2. Güvenli Görsel Gösterimi (SafeImage)
* Harici kaynak veya yerel sunucu kaynaklı kırık görsel hatalarını önleyen iki kademeli yedekleme yapısı.
* Yükleme esnasında yer tutucu ve hata durumunda otomatik devreye giren alternatif görsel gösterimi.

### 3. Ödeme ve Checkout Akışı
* **Luhn Algoritması:** Kart numarası girişi esnasında gerçek zamanlı geçerlilik denetimi.
* **Otomatik BIN Tespiti:** Kart numarası hanelerinden Visa, Mastercard, Troy ve American Express sağlayıcılarının algılanması.
* **3D Kart Animasyonu:** Form odaklarına göre kartın ön ve arka yüzünü çeviren görselleştirme.
* **Adres Seçimi:** İl ve ilçe hiyerarşisiyle kayıtlı teslimat adresleri arasında geçiş.

### 4. Kupon ve İndirim Uygulama
* Sepet ekranında anlık kupon doğrulama.
* Yüzdelik veya sabit indirim tutarlarının sepete yansıtılması ve minimum harcama koşullarının kontrolü.

### 5. Katalog Arama, Filtreleme ve Etkileşim
* Ürün adı, marka ve SKU üzerinden çalışan gerçek zamanlı katalog arama çubuğu.
* Fiyat aralığı, kategori ve marka bazlı çoklu filtreleme.
* Popover yapısında ekranı kilitlemeyen sipariş ve bildirim listesi (`NotificationDropdown`).
* Satın alınan ürünlere yıldız puanı verme ve yorum yazma modülü.

---

## Klasör Organizasyonu

```
src/
├── components/          # Ortak arayüz bileşenleri
│   ├── auth/            # Giriş, kayıt ve korumalı rota bileşenleri
│   ├── common/          # Güvenli görsel (SafeImage) gibi platform geneli bileşenler
│   ├── layout/          # Navbar, Footer ve bildirim bileşenleri
│   └── ui/              # Buton, modal ve form girdi öğeleri
├── context/             # Global Context sağlayıcıları (CartContext, FavoritesContext)
├── features/            # Alan bazlı işlevsel modüller (örn: chat/ bileşenleri, kancaları ve servisleri)
├── lib/                 # Axios yapılandırması, görsel çözümleyiciler ve kart algoritmaları
├── pages/               # Sayfa bileşenleri (Vitrin, Ürünler, Detay, Sepet, Ödeme vb.)
├── types/               # TypeScript tip ve arayüz sözleşmeleri
├── App.tsx              # Uygulama rota şeması
└── main.tsx             # React DOM başlangıç noktası
```

---

## Kurulum ve Çalıştırma

```bash
# Paket bağımlılıklarını kurun
npm install

# Geliştirme sunucusunu başlatın (Port: 5173)
npm run dev

# Tip denetimi ve üretim derlemesi
npm run build
```
