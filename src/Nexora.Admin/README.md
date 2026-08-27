# Nexora Admin Portal (Yönetim Paneli)

Nexora modern e-ticaret platformunun merkezi yönetim, sipariş karşılama, kupon yönetimi, katalog ve stok kontrol paneli.

---

## 🛠️ Teknoloji Yığını ve Mimarisi

* **Framework:** React 19 + TypeScript (Strict Mode)
* **Build Aracı:** Vite
* **Stil & Tasarım:** Tailwind CSS v4 (Light Premium Theme - `#F97316` Vurgu Rengi)
* **İkon Seti:** Lucide React
* **Veri Yönetimi & Cache:** TanStack React Query v5 (`keepPreviousData`, akıllı önbellek)
* **İletişim & Güvenlik:** Axios (JWT Access & Refresh Token Interceptor)

---

## 🚀 Geliştirilen Modüller ve Özellikler

### 1. 🔐 Güvenlik ve Yetkilendirme (Admin Auth)
* **Rol Koruması:** Sadece `Admin` rolüne sahip kullanıcılar paneli görüntüleyebilir.
* **Akıllı Token Yenileme:** 401 Unauthorized durumunda arka planda otomatik `Refresh Token` mekanizması çalışır.
* **Giriş Bilgileri:** `admin@nexora.com` / `Admin123!`

### 2. 📊 Dashboard (Mağaza Genel Bakış)
* **Metrik Kartları:** Toplam Sipariş, Aktif Stok Hacmi (₺), Canlıdaki Ürün Adedi, Kategori ve Marka Sayısı.
* **Son Gelen Siparişler:** En güncel siparişlerin canlı durum ve tutar özeti.
* **Kritik Stok Uyarısı:** Stoğu kritik seviyede (<= 30 adet) olan ürünlerin anlık uyarı listesi.

### 3. 📦 Sipariş Yönetimi (`/orders`)
* **Performanslı Listeleme:** SQL Projeksiyonu (`.Select()`) ve TanStack Query `keepPreviousData` ile akıcı sayfalama.
* **Gelişmiş Arama:** Sipariş No (`NX-ORD-...`), Müşteri Adı/Soyadı, E-posta ve Teslimat Adresine göre anlık arama.
* **Akıllı 24 Saat Rozeti:** Son 24 saat içinde verilen siparişlerin yanında parıldayan şık **"YENİ"** rozeti.
* **Durum Filtreleri:** *Tüm Siparişler, Ödenen Siparişler, Hazırlanıyor, Kargoya Verildi, Teslim Edildi, İptal Edilenler*.
* **Canlı Durum Güncelleme:** Tek tıkla sipariş durumunu `Ödendi -> Hazırlanıyor -> Kargoya Verildi -> Teslim Edildi -> İptal` aşamalarına taşıma.

### 4. 🎟️ Kupon & Promosyon Yönetimi (`/coupons`)
* **Kupon İstatistikleri:** Toplam Kupon, Aktif Kupon ve Toplam Kullanım Adedi kartları.
* **Kupon Oluşturma:** Yüzdelik (%) veya Sabit Tutar (TL) indirim, minimum sepet tutarı, kullanım limiti ve son kullanma tarihi belirleme.
* **Canlı Limit İlerleme Çubuğu:** Kuponların doluluk oranını canlı renkli bar ile takip etme.
* **Sipariş Sayacı Entegrasyonu:** Müşteri checkout'ta kuponu kullandığında sayaç otomatik `+1` artar.

### 5. 🛍️ Ürün, Kategori & Marka Yönetimi
* **Aktif / Pasif ToggleSwitch:** Ürün, kategori veya markayı silmeden tek tıkla satışa kapatma / açma (Soft state).
* **ConfirmModal:** Silme işlemlerinde tarayıcı popup'ı yerine platforma özel zarif onay penceresi.
* **Arama & Filtreleme:** Kategori ve Marka bazlı anlık katalog filtreleme.

---

## 💻 Yerel Geliştirme Ortamı

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat (Port: 5174)
npm run dev

# TypeScript ve Production Build kontrolü
npm run build
```

---

## 🎨 Tasarım Prensipleri
* **Ferah & Modern Açık Tema:** Soft gri kartlar (`bg-slate-50`), net border'lar (`border-slate-200`) ve turuncu aksiyon butonları.
* **Sıfır `any` Prensibi:** Tüm veri modelleri strict TypeScript interface'leri ile korunmaktadır.
* **Temiz Kod (Clean Code):** Gereksiz yorum satırlarından arındırılmış, modüler ve okunabilir yapıdadır.
