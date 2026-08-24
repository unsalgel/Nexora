# Nexora Admin Portal (Yönetim Paneli)

Nexora modern e-ticaret platformunun merkezi yönetim, sipariş karşılama, katalog ve stok kontrol paneli.

---

## 🛠️ Teknoloji Yığını ve Mimarisi

* **Framework:** React 19 + TypeScript (Strict Mode)
* **Build Aracı:** Vite
* **Stil & Tasarım:** Tailwind CSS v4 (Light Premium Theme - `#F97316` Vurgu Rengi)
* **İkon Seti:** Lucide React
* **Veri Yönetimi & Cache:** TanStack React Query v5 (`keepPreviousData`, akıllı önbellek)
* **İletişim & Güvenlik:** Axios (JWT Access & Refresh Token Interceptor)

---

## 🚀 Şimdiye Kadar Geliştirilen Modüller ve Özellikler

### 1. 🔐 Güvenlik ve Yetkilendirme (Admin Auth)
* **Rol Koruması:** Sadece `Admin` rolüne sahip kullanıcılar paneli görüntüleyebilir.
* **Akıllı Token Yenileme:** 401 Unauthorized durumunda arka planda otomatik `Refresh Token` mekanizması çalışır.
* **Giriş Bilgileri:** `admin@nexora.com` / `Admin123!`

### 2. 📊 Dashboard (Mağaza Genel Bakış)
* **Metrik Kartları:**
  * Toplam Sipariş Sayısı
  * Toplam Aktif Stok Hacmi (₺)
  * Canlıdaki Katalog Ürün Adedi
  * Aktif Kategori ve Anlaşmalı Marka Sayısı
* **Son Gelen Siparişler:** En güncel 5 siparişin canlı durum ve tutar özeti.
* **Son Eklenen Ürünler & Kritik Stok Uyarısı:** Stoğu kritik seviyede (<= 30 adet) olan ürünlerin anlık uyarı listesi.
* **Tek Tıkla Senkronizasyon:** Tüm mağaza metriklerini tek butonla canlı tazeleme.

### 3. 📦 Sipariş Yönetimi (`/orders`)
* **Performanslı Listeleme:** SQL Projeksiyonu (`.Select()`) ve TanStack Query `keepPreviousData` ile sıfır bekleme süreli akıcı sayfalama.
* **Gelişmiş Arama:** Sipariş No (`NX-ORD-...`), Müşteri Adı/Soyadı, E-posta ve Teslimat Adresine göre anlık arama.
* **Durum Filtreleri:**
  * *Tüm Siparişler, Beklemede, Hazırlanıyor, Kargoya Verildi, Teslim Edildi, İptal Edilenler*
* **Sipariş Detay Modalı:**
  * Sipariş verilen ürünlerin detayları (Ürün Adı, SKU, Birim Fiyat, Miktar, Toplam Tutar).
  * Müşteri ve Teslimat Adresi bilgi kartları.
* **Canlı Kargo Durumu Güncelleme:** Tek tıkla sipariş durumunu `Hazırlanıyor -> Kargoya Verildi -> Teslim Edildi -> İptal` aşamalarına taşıma (`PUT /api/orders/{id}/status`).
* **İş Kuralları:** Teslim edilmiş veya iptal edilmiş siparişlerin durumu güvenlik gereği kilitlenir.

### 4. 🛍️ Ürün ve Varyant Yönetimi (`/products`)
* **Ürün Kataloğu:** Sayfalanmış, filtrelenebilir ve sıralanabilir ürün tablosu.
* **Yeni Ürün & Varyant Ekleme:** Ürün adı, SKU, açıklama, kategori, marka, taban fiyat ve stok belirleme.
* **Varyant Desteği:** Renk, Beden vb. dinamik varyant tanımlama.
* **Aktif / Pasif Yönetimi:** Ürünleri tek tıkla satışa açma / kapatma.

### 5. 🗂️ Kategori & Marka Yönetimi (`/categories`, `/brands`)
* **Kategori Yönetimi:** 5 ana kategori (Elektronik, Moda & Giyim, Ev & Yaşam, Kozmetik, Spor & Outdoor) tekilleştirilmiş ve canlı yönetilebilir yapıdadır.
* **Marka Yönetimi:** Anlaşmalı distribütör markaları tanımlama, düzenleme ve silme.

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
* **Temiz Kod (Clean Code):** Kod tabanı gereksiz yorum satırlarından arındırılmış, modüler ve okunabilir yapıdadır.
