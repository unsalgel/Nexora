# Nexora.Admin — Yönetim Portalı

Nexora e-ticaret platformunun merkezi idari yönetim, analitik, sipariş karşılama, kupon yönetimi, ürün görsel yükleme, katalog ve stok kontrol portalıdır.

---

## Mimari ve Teknoloji Yığını

* **Çekirdek:** React 19 + TypeScript (Strict Mode, `any` tipi kullanılmaz)
* **Derleme ve Paketleme:** Vite
* **Tasarım Sistemi:** Tailwind CSS v4 (Hafif, modern ve kurumsal renk paleti)
* **İkon Seti:** Lucide React
* **Veri Yönetimi ve Önbellek:** TanStack React Query v5 (`keepPreviousData` akıcı sayfalama desteği)
* **İletişim ve Güvenlik:** Axios (Merkezi Interceptor ile otomatik JWT Bearer ekleme, sessiz Refresh Token yenileme ve anlık token iptali)

---

## Modüller ve Fonksiyonel Özellikler

### 1. Güvenlik, Oturum ve Hesap Koruma (Admin Auth)
* Sadece `Admin` rolüne sahip kullanıcıların erişebildiği korumalı rota (`AdminRoute`).
* **Kademeli Kilitlenme Bildirimi:** Önceki başarısız giriş denemelerini tarih, saat ve IP bazında listeleyen güvenlik uyarı penceresi.
* **Anlık Çıkış (Logout):** Oturum kapatıldığında Access Token ve Refresh Token'ın eş zamanlı geçersiz kılınması.
* Oturum süresi dolduğunda (401 Unauthorized) arka planda otomatik çalışan `Refresh Token` yenileme mekanizması.
* Varsayılan Giriş: `admin@nexora.com` / `Admin123*`

### 2. Dashboard ve Satış Analitiği
* **Özet Metrik Kartları:** Toplam Ciro, Ortalama Sepet Tutarı (AOV), Tamamlanan İşlem Hacmi, Aktif Stok Hacmi (TL), Canlı Katalog Sayısı, Kategori ve Marka Ağı.
* **Dönemsel Satış Trend Çizgisi:** Son 7, 14 veya 30 günün günlük cirosunu ve sipariş adetlerini hover detaylarıyla gösteren dinamik çubuk grafik.
* **Kategori Gelir Dağılımı:** Kategorilerin toplam hasılattaki payını yüzde ve adet bazında gösteren ilerleme çubukları.
* **Sipariş Durumu Dağılımı:** Beklemede, Hazırlanıyor, Kargoda, Teslim Edildi ve İptal durumlarının oransal gösterimi.
* **Kritik Stok Uyarısı:** Stoğu kritik seviyenin (30 adet ve altı) altına düşen ürünlerin anlık alarm listesi.
* **Son Siparişler:** Mağazaya ulaşan en güncel siparişlerin anlık durum tablosu.

### 3. Sipariş Yönetimi (`/orders`)
* Veritabanı seviyesinde optimize edilmiş SQL projeksiyonları ile yüksek performanslı sayfalama.
* Sipariş Numarası (`NX-ORD-...`), Müşteri Adı, E-posta ve Teslimat Adresine göre anlık çoklu arama.
* Son 24 saat içinde oluşturulan siparişlerde otomatik parıldayan "YENİ" durum rozeti.
* Sipariş durumu filtreleme (Tümü, Beklemede, Hazırlanıyor, Kargoda, Teslim Edildi, İptal).
* Tek tıkla sipariş durumunu bir sonraki aşamaya taşıma veya iptal etme.

### 4. Ürün Yönetimi ve Gerçek Görsel Yükleme (`/products`)
* **Sürükle-Bırak Görsel Yükleme:** Bilgisayardan dosya seçme veya sürükleyip bırakarak yükleme; dosya formatı (JPG, PNG, WEBP) ve 5MB boyut denetimi.
* **Çoklu Görsel Desteği:** Hem yerel sunucuya dosya yükleme hem de harici URL bağlantısı desteği.
* **Varyant ve Stok Kontrolü:** SKU, fiyat ve stok kombinasyonlarını kolayca tanımlama.
* Ürünleri kalıcı silmeden satıştan çeken aktif/pasif anahtarları (`ToggleSwitch`).

### 5. Kupon ve Promosyon Yönetimi (`/coupons`)
* Yüzdelik (%) veya Sabit Tutar (TL) indirim kuponu tanımlama.
* Minimum sepet tutarı, kullanım kotası ve son kullanma tarihi belirleme.
* Kupon kullanım limitini gösteren canlı doluluk çubuğu.
* Müşteri checkout işlemiyle senkron çalışan kullanım sayacı.

### 6. Kategori ve Marka Yönetimi
* Kategori ve marka ağacı yönetimi.
* Silme işlemleri için platforma özel onay pencereleri (`ConfirmModal`).
* Kategori ve marka bazlı dinamik filtreleme ve arama.

---

## Geliştirme ve Çalıştırma

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın (Port: 5174)
npm run dev

# Tip kontrolü ve üretim derlemesi
npm run build
```
